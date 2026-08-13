import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/ReportTemplate";
import { MICA_GROUPS } from "@/lib/ai/mica-groups";
import { scoreGroup, noIssuerDetected } from "@/lib/ai/scoring";
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
  const groupMap: Partial<Record<string, MicaGroupData>> = {};
  for (const s of assessment.sections) {
    if (s.aiData) groupMap[s.sectionKey] = s.aiData as MicaGroupData;
  }

  const groupsWithDefs = MICA_GROUPS.map((def) => {
    const data = groupMap[def.key] ?? null;
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

  const element = React.createElement(ReportDocument, {
    tokenName: assessment.tokenName,
    ticker: assessment.ticker,
    status: assessment.status,
    overallScore: assessment.overallScore,
    flag: assessment.flag,
    reviewerNotes: assessment.reviewerNotes,
    narrative: assessment.aiNarrative,
    noIssuerDetected: noIssuerDetected(groupMap),
    createdAt: formatDate(assessment.createdAt),
    analystName: assessment.createdBy.name,
    reviewerName: assessment.reviewedBy?.name ?? null,
    groups: groupsWithDefs,
  });

  return renderToBuffer(element);
}
