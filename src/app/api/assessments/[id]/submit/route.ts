import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeOverallScore, scoreToFlag, SECTION_WEIGHTS } from "@/lib/scoring";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { sections: true },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessment.status !== "DRAFT" && assessment.status !== "REJECTED") {
    return NextResponse.json({ error: "Only DRAFT or REJECTED assessments can be submitted" }, { status: 409 });
  }

  // Compute overall score from saved section scores
  const sectionScores: Partial<Record<string, number | null>> = {};
  for (const section of assessment.sections) {
    sectionScores[section.sectionKey] = section.sectionScore;
  }

  const overallScore = computeOverallScore(sectionScores);
  const flag = scoreToFlag(overallScore);

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: {
      status: "SUBMITTED",
      overallScore,
      flag,
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: params.id,
      userId: session.user.id,
      action: "SUBMITTED",
      metadata: { overallScore, flag },
    },
  });

  return NextResponse.json(updated);
}
