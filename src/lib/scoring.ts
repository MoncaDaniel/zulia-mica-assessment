import type { SectionKey, SectionData } from "@/types/assessment";

// Fields in each section that carry a Yes/No/N/A score
// inverted=true means No=compliant (No=1 point, Yes=0 points)
interface ScoredField {
  key: string;
  inverted?: boolean;
  allowNA?: boolean;
}

const SCORED_FIELDS: Record<string, ScoredField[]> = {
  s02_issuer_legal: [
    { key: "issuerIdentifiable" },
    { key: "issuerAuthorised", allowNA: true },
    { key: "sourceCodeDisclosed" },
  ],
  s03_project_description: [
    { key: "clearUseCase" },
    { key: "roadmapDisclosed" },
  ],
  s04_tokenomics: [
    { key: "vestingSchedule" },
    { key: "mintingBurning" },
    { key: "fundingHistoryDisclosed" },
    { key: "priceOracleModel" },
  ],
  s05_team_advisors: [
    { key: "teamIdentifiable" },
    { key: "teamExperience" },
    { key: "teamTrackRecord" },
    { key: "advisorsDisclosed" },
  ],
  s06_whitepaper: [
    { key: "wpIssuerIdentification" },
    { key: "wpTokenDescription" },
    { key: "wpTokenomicsDetails" },
    { key: "wpRightsObligations" },
    { key: "wpRiskDisclosure" },
    { key: "wpGovernance" },
    { key: "wpTechnologySecurity" },
    { key: "wpUseCase" },
    { key: "wpRegulatoryCompliance" },
    { key: "wpTeamAdvisors" },
    { key: "wpMarketAnalysis" },
    { key: "wpDisclaimerLegal" },
    { key: "wpRoadmap" },
  ],
  s07_community: [
    { key: "bugBountyProgram" },
    { key: "communityParticipation" },
    { key: "communityEvents" },
    { key: "developerRelations" },
  ],
  s08_aml: [
    { key: "inbuiltAnonymisation", inverted: true },
    { key: "holdersIdentifiable", allowNA: true },
    { key: "blockchainAnalyticsTools" },
    { key: "transactionsTraceable" },
    { key: "listedOnExchanges" },
    { key: "illicitActivities", inverted: true },
    { key: "passiveRevenueRights", inverted: true },
    { key: "projectCommitment" },
  ],
  s09_technical: [
    { key: "securityIncidents", inverted: true },
    { key: "githubReviewed" },
    { key: "vulnerabilitiesManaged" },
    { key: "euIntegration" },
    { key: "smartContractAudit" },
  ],
  s10_mica_compliance: [
    { key: "reservesVerified", allowNA: true },
    { key: "executionFrameworkAligned" },
    { key: "marketAbuseMonitoring" },
    { key: "transparencyPublished" },
    { key: "significantTokenAssessment", allowNA: true },
  ],
};

// Sections contributing to the weighted overall score and their weights
export const SECTION_WEIGHTS: Partial<Record<string, number>> = {
  s10_mica_compliance: 0.25,
  s08_aml: 0.20,
  s06_whitepaper: 0.15,
  s02_issuer_legal: 0.15,
  s04_tokenomics: 0.10,
  s09_technical: 0.10,
  s05_team_advisors: 0.05,
};

export function scoreSectionData(sectionKey: string, data: SectionData): number | null {
  const fields = SCORED_FIELDS[sectionKey];
  if (!fields || fields.length === 0) return null;

  let points = 0;
  let denominator = 0;

  for (const field of fields) {
    const raw = data[field.key];
    const value = typeof raw === "string" ? raw.toUpperCase() : String(raw ?? "").toUpperCase();

    if (value === "N/A" || value === "NA") {
      // N/A fields are excluded from denominator
      continue;
    }

    if (value === "YES" || value === "NO") {
      denominator += 1;
      const isCompliant = field.inverted ? value === "NO" : value === "YES";
      if (isCompliant) points += 1;
    }
    // Unanswered fields (empty string) count as No for scoring purposes
    else if (value === "" || value === "UNDEFINED") {
      denominator += 1;
    }
  }

  if (denominator === 0) return null;
  return (points / denominator) * 100;
}

export function computeOverallScore(
  sectionScores: Partial<Record<string, number | null>>
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(SECTION_WEIGHTS)) {
    const score = sectionScores[key];
    if (score != null) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

export function scoreToFlag(score: number | null): "PASS" | "REVIEW" | "FAIL" | null {
  if (score == null) return null;
  if (score > 75) return "PASS";
  if (score >= 50) return "REVIEW";
  return "FAIL";
}

export function getSectionScoredFields(sectionKey: string): ScoredField[] {
  return SCORED_FIELDS[sectionKey] ?? [];
}

export const SECTION_DEFINITIONS: Array<{
  key: SectionKey;
  label: string;
  description: string;
}> = [
  { key: "s01_general_info", label: "General Information", description: "Basic token and issuer details" },
  { key: "s02_issuer_legal", label: "Issuer & Legal", description: "Legal entity, authorisation, and source code" },
  { key: "s03_project_description", label: "Project Description", description: "Use-case and roadmap" },
  { key: "s04_tokenomics", label: "Tokenomics", description: "Supply, distribution, vesting, and funding" },
  { key: "s05_team_advisors", label: "Team & Advisors", description: "Team identifiability, experience, and track record" },
  { key: "s06_whitepaper", label: "Whitepaper Assessment", description: "MiCA whitepaper completeness checklist" },
  { key: "s07_community", label: "Community", description: "Size, engagement, and ecosystem health" },
  { key: "s08_aml", label: "AML / Financial Crime", description: "Anonymisation, traceability, and AML safeguards" },
  { key: "s09_technical", label: "Technical Assessment", description: "Security audits, vulnerabilities, and EU integration" },
  { key: "s10_mica_compliance", label: "MiCA Compliance", description: "Classification, reserves, execution, and monitoring" },
];
