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

// True when the extraction determined this crypto-asset has no identifiable
// issuer/offeror (see the "no-issuer cascade" in prompts.ts) — derived from
// Group 1 (Offeror) coming back with every item "na". Shared by the scoring,
// narrative, and every UI/PDF surface that renders a flag, so this
// derivation only lives in one place.
export function noIssuerDetected(groups: Partial<Record<string, MicaGroupData>>): boolean {
  const offeror = groups["g01_offeror"];
  if (!offeror || Object.keys(offeror).length === 0) return false;
  return Object.values(offeror).every((f) => f.status === "na");
}

export function complianceFlag(
  score: number | null,
  groups?: Partial<Record<string, MicaGroupData>>,
): "PASS" | "REVIEW" | "FAIL" | "EXEMPT" | null {
  if (groups && noIssuerDetected(groups)) return "EXEMPT";
  if (score === null) return null;
  if (score >= 75) return "PASS";
  if (score >= 50) return "REVIEW";
  return "FAIL";
}
