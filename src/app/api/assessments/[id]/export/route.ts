import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAssessmentPDF } from "@/lib/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Public demo deployment: full PDF export is gated behind a contact
  // request rather than disabled outright -- the on-screen report already
  // shows the complete analysis. See the report page's contact card.
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(
      {
        error: "PDF export is disabled in this public demo.",
        detail: "The full analysis is visible on the report page. Contact the developer to receive the downloadable PDF.",
      },
      { status: 403 },
    );
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      sections: { orderBy: { sectionKey: "asc" } },
    },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfBuffer = await generateAssessmentPDF(assessment as Parameters<typeof generateAssessmentPDF>[0]);

  await prisma.auditLog.create({
    data: {
      assessmentId: params.id,
      userId: session.user.id,
      action: "EXPORTED",
    },
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mica-assessment-${assessment.tokenName.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
