import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessment.status !== "DRAFT" && assessment.status !== "REJECTED") {
    return NextResponse.json({ error: "Only DRAFT or REJECTED assessments can be submitted" }, { status: 409 });
  }

  // overallScore/flag are already computed by the AI extraction pipeline
  // (src/lib/ai/scoring.ts, run during /analyze) — submission is a pure
  // status transition and must not recompute or touch them.
  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: { status: "SUBMITTED" },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: params.id,
      userId: session.user.id,
      action: "SUBMITTED",
      metadata: { overallScore: assessment.overallScore, flag: assessment.flag },
    },
  });

  return NextResponse.json(updated);
}
