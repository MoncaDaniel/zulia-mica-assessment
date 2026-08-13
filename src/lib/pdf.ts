import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/ReportTemplate";
import { MICA_GROUPS } from "@/lib/ai/mica-groups";
import { scoreGroup } from "@/lib/ai/scoring";
import type { MicaGroupData } from "@/lib/ai/types";
import { formatDate } from "@/lib/utils";

export interface PDFAssessmentData {
  id: string;
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  reviewerNotes: string | null;
  aiNarrative: string | null;
  createdAt: Date;
  createdBy: { name: string; email: string };
  reviewedBy: { name: string; email: string } | null;
  sections: Array<{
    sectionKey: string; // MICA_GROUPS key (e.g. "g01_offeror")
    aiData: unknown;    // MicaGroupData, stored as JSON
  }>;
}

export async function generateAssessmentPDF(assessment: PDFAssessmentData): Promise<Buffer> {
  const groupsWithDefs = MICA_GROUPS.map((def) => {
    const saved = assessment.sections.find((s) => s.sectionKey === def.key);
    const data = (saved?.aiData ?? null) as MicaGroupData | null;
    return {
      key: def.key,
      label: def.label,
      articleRef: def.articleRef,
      scope: def.scope,
      weight: def.weight,
      score: data ? scoreGroup(data) : null, // 0-1 fraction, or null if wholly N/A/unscored
      items: def.items.map((item) => ({
        key: item.key,
        label: item.label,
        articleRef: item.articleRef,
        finding: data?.[item.key] ?? null,
      })),
    };
  });

  // Group 1 (Offeror) coming back entirely "na" is the no-issuer cascade
  // signal from the extraction prompt — same derivation DocumentSheet uses
  // on-screen, kept in sync here so the PDF explains the same exclusion
  // rather than silently showing three empty groups.
  const offerorGroup = groupsWithDefs.find((g) => g.key === "g01_offeror");
  const noIssuerDetected =
    !!offerorGroup &&
    offerorGroup.items.some((i) => i.finding) &&
    offerorGroup.items.every((i) => i.finding?.status === "na" || i.finding === null);

  const element = React.createElement(ReportDocument, {
    tokenName: assessment.tokenName,
    ticker: assessment.ticker,
    status: assessment.status,
    overallScore: assessment.overallScore,
    flag: assessment.flag,
    reviewerNotes: assessment.reviewerNotes,
    narrative: assessment.aiNarrative,
    noIssuerDetected,
    createdAt: formatDate(assessment.createdAt),
    analystName: assessment.createdBy.name,
    reviewerName: assessment.reviewedBy?.name ?? null,
    groups: groupsWithDefs,
  });

  return renderToBuffer(element);
}
