import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/ReportTemplate";
import { SECTION_DEFINITIONS, SECTION_WEIGHTS } from "@/lib/scoring";
import { formatDate, formatScore } from "@/lib/utils";

export interface PDFAssessmentData {
  id: string;
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  reviewerNotes: string | null;
  createdAt: Date;
  createdBy: { name: string; email: string };
  reviewedBy: { name: string; email: string } | null;
  sections: Array<{
    sectionKey: string;
    sectionName: string;
    sectionScore: number | null;
    data: Record<string, unknown>;
    completedAt: Date | null;
  }>;
}

export async function generateAssessmentPDF(assessment: PDFAssessmentData): Promise<Buffer> {
  const sectionsWithDefs = SECTION_DEFINITIONS.map((def) => {
    const saved = assessment.sections.find((s) => s.sectionKey === def.key);
    return {
      key: def.key,
      label: def.label,
      description: def.description,
      score: saved?.sectionScore ?? null,
      weight: SECTION_WEIGHTS[def.key] ?? null,
      data: (saved?.data ?? {}) as Record<string, string>,
      completedAt: saved?.completedAt ?? null,
    };
  });

  const element = React.createElement(ReportDocument, {
    tokenName: assessment.tokenName,
    ticker: assessment.ticker,
    status: assessment.status,
    overallScore: assessment.overallScore,
    flag: assessment.flag,
    reviewerNotes: assessment.reviewerNotes,
    createdAt: formatDate(assessment.createdAt),
    analystName: assessment.createdBy.name,
    reviewerName: assessment.reviewedBy?.name ?? null,
    sections: sectionsWithDefs,
  });

  return renderToBuffer(element);
}
