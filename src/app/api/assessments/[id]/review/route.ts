import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: params.id } });
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessment.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Only SUBMITTED assessments can be reviewed" }, { status: 409 });
  }

  const newStatus = parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      reviewedById: session.user.id,
      reviewerNotes: parsed.data.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: params.id,
      userId: session.user.id,
      action: parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED",
      metadata: { notes: parsed.data.notes },
    },
  });

  return NextResponse.json(updated);
}
