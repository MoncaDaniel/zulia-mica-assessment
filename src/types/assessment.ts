import { z } from "zod";

export type SectionKey =
  | "s01_general_info"
  | "s02_issuer_legal"
  | "s03_project_description"
  | "s04_tokenomics"
  | "s05_team_advisors"
  | "s06_whitepaper"
  | "s07_community"
  | "s08_aml"
  | "s09_technical"
  | "s10_mica_compliance";

export type SectionData = Record<string, string | number | null | undefined>;

export type YesNo = "Yes" | "No";
export type YesNoNA = "Yes" | "No" | "N/A";

// ─── Section schemas ──────────────────────────────────────────────────────────

export const S01Schema = z.object({
  chain: z.string().optional(),
  consensusMechanism: z.string().optional(),
  explorerUrl: z.string().optional(),
  smartContractAddress: z.string().optional(),
  issuerLegalName: z.string().optional(),
  issueDate: z.string().optional(),
  whitepaperUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  jurisdictions: z.string().optional(),
  esgConsiderations: z.string().optional(),
  tokenClassification: z.enum(["EMT", "ART", "OCA", "Utility", "Other", ""]).optional(),
  communityLinks: z.string().optional(),
});

export const S02Schema = z.object({
  issuerIdentifiable: z.enum(["Yes", "No", ""]).optional(),
  issuerIdentifiableNotes: z.string().optional(),
  issuerAuthorised: z.enum(["Yes", "No", "N/A", ""]).optional(),
  issuerAuthorisedNotes: z.string().optional(),
  sourceCodeDisclosed: z.enum(["Yes", "No", ""]).optional(),
  sourceCodeUrl: z.string().optional(),
  sourceCodeNotes: z.string().optional(),
});

export const S03Schema = z.object({
  projectDescription: z.string().optional(),
  clearUseCase: z.enum(["Yes", "No", ""]).optional(),
  clearUseCaseNotes: z.string().optional(),
  roadmapDisclosed: z.enum(["Yes", "No", ""]).optional(),
  roadmapNotes: z.string().optional(),
});

export const S04Schema = z.object({
  totalSupply: z.string().optional(),
  circulatingSupplyTGE: z.string().optional(),
  distributionAllocation: z.string().optional(),
  vestingSchedule: z.enum(["Yes", "No", ""]).optional(),
  vestingDetails: z.string().optional(),
  mintingBurning: z.enum(["Yes", "No", ""]).optional(),
  mintingBurningDetails: z.string().optional(),
  tokenSwapDetails: z.string().optional(),
  fundingHistoryDisclosed: z.enum(["Yes", "No", ""]).optional(),
  fundingHistoryDetails: z.string().optional(),
  priceOracleModel: z.enum(["Yes", "No", ""]).optional(),
  priceOracleDetails: z.string().optional(),
  pricePerformance: z.string().optional(),
  tokenUseDescription: z.string().optional(),
  privateOfferPrice: z.string().optional(),
  publicOfferPrice: z.string().optional(),
  currentPrice: z.string().optional(),
  valuation: z.string().optional(),
});

export const S05Schema = z.object({
  teamIdentifiable: z.enum(["Yes", "No", ""]).optional(),
  teamIdentifiableNotes: z.string().optional(),
  teamExperience: z.enum(["Yes", "No", ""]).optional(),
  teamExperienceNotes: z.string().optional(),
  teamTrackRecord: z.enum(["Yes", "No", ""]).optional(),
  teamTrackRecordNotes: z.string().optional(),
  advisorsDisclosed: z.enum(["Yes", "No", ""]).optional(),
  advisorsNotes: z.string().optional(),
  teamAllocationPct: z.string().optional(),
  teamAllocationVesting: z.string().optional(),
  otherTeamInfo: z.string().optional(),
});

export const S06Schema = z.object({
  wpIssuerIdentification: z.enum(["Yes", "No", ""]).optional(),
  wpTokenDescription: z.enum(["Yes", "No", ""]).optional(),
  wpTokenomicsDetails: z.enum(["Yes", "No", ""]).optional(),
  wpRightsObligations: z.enum(["Yes", "No", ""]).optional(),
  wpRiskDisclosure: z.enum(["Yes", "No", ""]).optional(),
  wpGovernance: z.enum(["Yes", "No", ""]).optional(),
  wpTechnologySecurity: z.enum(["Yes", "No", ""]).optional(),
  wpUseCase: z.enum(["Yes", "No", ""]).optional(),
  wpRegulatoryCompliance: z.enum(["Yes", "No", ""]).optional(),
  wpTeamAdvisors: z.enum(["Yes", "No", ""]).optional(),
  wpMarketAnalysis: z.enum(["Yes", "No", ""]).optional(),
  wpDisclaimerLegal: z.enum(["Yes", "No", ""]).optional(),
  wpRoadmap: z.enum(["Yes", "No", ""]).optional(),
  wpComments: z.string().optional(),
});

export const S07Schema = z.object({
  communitySize: z.string().optional(),
  communityPlatforms: z.string().optional(),
  communityEngagement: z.enum(["Low", "Medium", "High", ""]).optional(),
  communityEngagementNotes: z.string().optional(),
  communitySentiment: z.enum(["Positive", "Neutral", "Negative", ""]).optional(),
  communitySentimentNotes: z.string().optional(),
  bugBountyProgram: z.enum(["Yes", "No", ""]).optional(),
  bugBountyLink: z.string().optional(),
  communityParticipation: z.enum(["Yes", "No", ""]).optional(),
  communityParticipationNotes: z.string().optional(),
  communityEvents: z.enum(["Yes", "No", ""]).optional(),
  communityEventsNotes: z.string().optional(),
  developerRelations: z.enum(["Yes", "No", ""]).optional(),
  developerRelationsNotes: z.string().optional(),
  tokenHoldersCount: z.string().optional(),
  tokenHoldersNotes: z.string().optional(),
  otherCommunityInfo: z.string().optional(),
});

export const S08Schema = z.object({
  fitTestResult: z.string().optional(),
  inbuiltAnonymisation: z.enum(["Yes", "No", ""]).optional(),
  holdersIdentifiable: z.enum(["Yes", "No", "N/A", ""]).optional(),
  blockchainAnalyticsTools: z.enum(["Yes", "No", ""]).optional(),
  blockchainAnalyticsToolName: z.string().optional(),
  transactionsTraceable: z.enum(["Yes", "No", ""]).optional(),
  transactionsTraceableNotes: z.string().optional(),
  listedOnExchanges: z.enum(["Yes", "No", ""]).optional(),
  exchangesList: z.string().optional(),
  dailyTradingVolume: z.string().optional(),
  illicitActivities: z.enum(["Yes", "No", ""]).optional(),
  illicitActivitiesDetails: z.string().optional(),
  passiveRevenueRights: z.enum(["Yes", "No", ""]).optional(),
  passiveRevenueNotes: z.string().optional(),
  projectCommitment: z.enum(["Yes", "No", ""]).optional(),
  projectCommitmentNotes: z.string().optional(),
});

export const S09Schema = z.object({
  securityIncidents: z.enum(["Yes", "No", ""]).optional(),
  securityIncidentsDetails: z.string().optional(),
  githubReviewed: z.enum(["Yes", "No", ""]).optional(),
  githubUrl: z.string().optional(),
  vulnerabilitiesManaged: z.enum(["Yes", "No", ""]).optional(),
  vulnerabilitiesNotes: z.string().optional(),
  euIntegration: z.enum(["Yes", "No", ""]).optional(),
  euIntegrationNotes: z.string().optional(),
  smartContractAudit: z.enum(["Yes", "No", ""]).optional(),
  auditorsName: z.string().optional(),
  auditReportLink: z.string().optional(),
  otherTechnicalConcerns: z.string().optional(),
});

export const S10Schema = z.object({
  micaClassification: z.enum(["EMT", "ART", "OCA", "None", ""]).optional(),
  reservesVerified: z.enum(["Yes", "No", "N/A", ""]).optional(),
  reservesNotes: z.string().optional(),
  executionFrameworkAligned: z.enum(["Yes", "No", ""]).optional(),
  executionFrameworkNotes: z.string().optional(),
  marketAbuseMonitoring: z.enum(["Yes", "No", ""]).optional(),
  marketAbuseNotes: z.string().optional(),
  transparencyPublished: z.enum(["Yes", "No", ""]).optional(),
  transparencyNotes: z.string().optional(),
  significantTokenAssessment: z.enum(["Yes", "No", "N/A", ""]).optional(),
  significantTokenNotes: z.string().optional(),
});

export type S01Data = z.infer<typeof S01Schema>;
export type S02Data = z.infer<typeof S02Schema>;
export type S03Data = z.infer<typeof S03Schema>;
export type S04Data = z.infer<typeof S04Schema>;
export type S05Data = z.infer<typeof S05Schema>;
export type S06Data = z.infer<typeof S06Schema>;
export type S07Data = z.infer<typeof S07Schema>;
export type S08Data = z.infer<typeof S08Schema>;
export type S09Data = z.infer<typeof S09Schema>;
export type S10Data = z.infer<typeof S10Schema>;

export interface AssessmentWithSections {
  id: string;
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  reviewerNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string; email: string } | null;
  sections: Array<{
    id: string;
    sectionKey: string;
    sectionName: string;
    sectionScore: number | null;
    data: Record<string, unknown>;
    completedAt: Date | null;
  }>;
}
