// Per-item finding for a MiCA checklist entry
export interface MicaItemFinding {
  status:     "found" | "not_found" | "na" | "";  // "" = insufficient data
  excerpt:    string;                              // direct quote from whitepaper (max 150 chars)
  confidence: number;                             // 0–1
  reasoning:  string;                             // one sentence: why this status was assigned
}

// All item findings for one group — keyed by item.key from mica-groups.ts
export type MicaGroupData = Record<string, MicaItemFinding>;

// Full analysis result across all 12 groups
export interface MicaAnalysisResult {
  groups:     Partial<Record<string, MicaGroupData>>;
  narrative:  string;
  tokensUsed: number;
}

// Confidence thresholds
export const CONFIDENCE_HIGH = 0.75;
export const CONFIDENCE_MED  = 0.45;

export function confidenceLabel(c: number): "high" | "medium" | "low" {
  if (c >= CONFIDENCE_HIGH) return "high";
  if (c >= CONFIDENCE_MED)  return "medium";
  return "low";
}

// Legacy types — kept so existing imports don't break
export interface AiFieldSuggestion {
  answer:        "Yes" | "No" | "N/A" | "";
  confidence:    number;
  citation:      string;
  justification: string;
}
export type AiSectionData = Record<string, AiFieldSuggestion>;
export interface AiAnalysisResult {
  sections:   Partial<Record<string, AiSectionData>>;
  narrative:  string;
  tokensUsed: number;
}
