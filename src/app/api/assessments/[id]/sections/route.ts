import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreSectionData, SECTION_DEFINITIONS } from "@/lib/scoring";
import type { SectionData } from "@/types/assessment";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessment.status !== "DRAFT" && assessment.status !== "REJECTED") {
    return NextResponse.json({ error: "Assessment is not editable" }, { status: 409 });
  }

  const body = await req.json();
  const { sectionKey, data } = body as { sectionKey: string; data: SectionData };

  const sectionDef = SECTION_DEFINITIONS.find((s) => s.key === sectionKey);
  if (!sectionDef) {
    return NextResponse.json({ error: "Invalid section key" }, { status: 400 });
  }

  const sectionScore = scoreSectionData(sectionKey, data);

  const section = await prisma.assessmentSection.upsert({
    where: {
      assessmentId_sectionKey: { assessmentId: params.id, sectionKey },
    },
    update: {
      data: data as object,
      sectionScore,
      completedAt: new Date(),
    },
    create: {
      assessmentId: params.id,
      sectionKey,
      sectionName: sectionDef.label,
      data: data as object,
      sectionScore,
      completedAt: new Date(),
    },
  });

  // Write denormalised AssessmentField rows for audit / reporting
  await prisma.assessmentField.deleteMany({ where: { sectionId: section.id } });
  const fieldRows = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([fieldKey, fieldValue]) => ({
      sectionId: section.id,
      fieldKey,
      fieldValue: String(fieldValue),
    }));

  if (fieldRows.length > 0) {
    await prisma.assessmentField.createMany({ data: fieldRows });
  }

  await prisma.auditLog.create({
    data: {
      assessmentId: params.id,
      userId: session.user.id,
      action: "SECTION_SAVED",
      metadata: { sectionKey, sectionScore },
    },
  });

  return NextResponse.json({ section, sectionScore });
}
