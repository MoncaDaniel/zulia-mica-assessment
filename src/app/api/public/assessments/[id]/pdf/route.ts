export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAssessmentPDF } from "@/lib/pdf";
import { getPublicUserId } from "@/lib/anon";

/**
 * GET /api/public/assessments/[id]/pdf — the full downloadable report for a
 * free/public assessment. Ungated on purpose: giving away one complete,
 * quote-rich PDF is the whole point of the free flow. Still restricted to
 * assessments owned by the public system user, and only once analysis has
 * finished.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const publicUserId = await getPublicUserId();

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      sections: { orderBy: { sectionKey: "asc" } },
    },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessment.createdById !== publicUserId) {
    return NextResponse.json({ error: "Not a public assessment" }, { status: 403 });
  }
  if (assessment.aiStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "The analysis for this assessment hasn't finished yet." },
      { status: 409 },
    );
  }

  const pdfBuffer = await generateAssessmentPDF(
    assessment as Parameters<typeof generateAssessmentPDF>[0],
    { publicMode: true },
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mica-assessment-${assessment.tokenName.replace(
        /\s+/g,
        "-",
      )}.pdf"`,
    },
  });
}
