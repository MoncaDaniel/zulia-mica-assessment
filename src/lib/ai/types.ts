// Per-field AI suggestion stored in AssessmentSection.aiData
export interface AiFieldSuggestion {
  answer: "Yes" | "No" | "N/A" | "";
  confidence: number;       // 0–1
  citation: string;         // direct quote or reference from source
  justification: string;    // one sentence explanation
}

// Map of fieldKey → suggestion for one section
export type AiSectionData = Record<string, AiFieldSuggestion>;

// Full AI analysis result for all 10 sections
export interface AiAnalysisResult {
  sections: Partial<Record<string, AiSectionData>>;
  narrative: string;
  tokensUsed: number;
}

// Confidence thresholds for UI display
export const CONFIDENCE_HIGH = 0.75;
export const CONFIDENCE_MED  = 0.45;

export function confidenceLabel(c: number): "high" | "medium" | "low" {
  if (c >= CONFIDENCE_HIGH) return "high";
  if (c >= CONFIDENCE_MED)  return "medium";
  return "low";
}
