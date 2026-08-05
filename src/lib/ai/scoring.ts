// Pure scoring functions — no Node.js dependencies, safe to import in client components
import { MICA_GROUPS } from "./mica-groups";
import type { MicaGroupData, MicaItemFinding } from "./types";

export function scoreGroup(data: MicaGroupData): number | null {
  const items  = Object.values(data) as MicaItemFinding[];
  const scored = items.filter((i) => i.status === "found" || i.status === "not_found");
  if (scored.length === 0) return null;
  return scored.filter((i) => i.status === "found").length / scored.length;
}

export function overallScore(groups: Partial<Record<string, MicaGroupData>>): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const group of MICA_GROUPS) {
    const data  = groups[group.key];
    if (!data) continue;
    const score = scoreGroup(data);
    if (score === null) continue;
    weightedSum += group.weight * score;
    totalWeight += group.weight;
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 100);
}

export function complianceFlag(score: number | null): "PASS" | "REVIEW" | "FAIL" | null {
  if (score === null) return null;
  if (score >= 75) return "PASS";
  if (score >= 50) return "REVIEW";
  return "FAIL";
}
