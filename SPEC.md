# MiCA Token Assessment Platform — Product Specification

## 1. Purpose

Enable Zulia Networks compliance analysts to conduct structured, repeatable, auditable assessments of crypto-asset tokens against the EU Markets in Crypto-Assets Regulation (MiCA). Each assessment produces a compliance score, a flag (PASS / REVIEW / FAIL), and an exportable PDF report.

---

## 2. User Roles

| Role | Permissions |
|---|---|
| **ANALYST** | Create assessments, fill all sections, save drafts, submit for review |
| **REVIEWER** | View all assessments, approve or reject submitted assessments, add reviewer notes |
| **ADMIN** | All of the above + manage users, delete assessments, force status changes |

---

## 3. Workflows

### 3.1 Create & Draft

1. Analyst clicks **New Assessment** on the dashboard.
2. Enters token name and ticker → assessment created with status `DRAFT`.
3. Wizard opens at Section 1. Analyst navigates sections freely.
4. Each section auto-saves on **Save & Continue** or manual **Save Draft**.
5. Section nav shows: Not Started / In Progress / Complete per section.

### 3.2 Submit for Review

1. Analyst clicks **Submit for Review** (available when all 10 sections have been saved at least once).
2. Status → `SUBMITTED`. Analyst can no longer edit.
3. Score is calculated and stored.
4. Reviewer is notified (dashboard flag).

### 3.3 Review

1. Reviewer opens submitted assessment (read-only view + reviewer notes panel).
2. Clicks **Approve** → status `APPROVED`, flag written.
3. Or **Reject with notes** → status `REJECTED`.
4. Rejected assessments return to `DRAFT` for analyst revision.

### 3.4 Export

- Available on any assessment in `APPROVED` status (or `SUBMITTED` for reviewer/admin).
- Produces a PDF report via `/api/assessments/[id]/export`.

---

## 4. Assessment Sections & Fields

### Section 01 — General Information

*Informational only — no scored Yes/No fields.*

| Field Key | Label | Type |
|---|---|---|
| `chain` | Chain / Network | text |
| `consensusMechanism` | Consensus Mechanism | text |
| `explorerUrl` | Blockchain Explorer URL | url |
| `smartContractAddress` | Smart Contract Address | text |
| `issuerLegalName` | Issuer Legal Name | text |
| `issueDate` | Issue Date | date (YYYY-MM-DD) |
| `whitepaperUrl` | Whitepaper URL | url |
| `websiteUrl` | Website / Docs URL | url |
| `jurisdictions` | Jurisdiction(s) | text (comma-separated) |
| `esgConsiderations` | ESG Considerations | textarea |
| `tokenClassification` | Token Classification | select: EMT / ART / OCA / Utility / Other |
| `communityLinks` | Community Links | textarea |

---

### Section 02 — Issuer & Legal

*Weight: 15% of overall score.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `issuerIdentifiable` | Issuer identifiable (name, reg no., jurisdiction, contacts) | Yes/No | Yes=1, No=0 |
| `issuerIdentifiableNotes` | Notes | textarea | — |
| `issuerAuthorised` | Issuer authorised if required (EMT = credit/e-money institution) | Yes/No/N/A | Yes=1, No=0, N/A=excl |
| `issuerAuthorisedNotes` | Notes | textarea | — |
| `sourceCodeDisclosed` | Source code repository disclosed (GitHub URL) | Yes/No | Yes=1, No=0 |
| `sourceCodeUrl` | Repository URL | url | — |
| `sourceCodeNotes` | Notes | textarea | — |

---

### Section 03 — Project Description

*Informational + 2 scored fields.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `projectDescription` | Description of the project | textarea | — |
| `clearUseCase` | Clear use-case / intended function | Yes/No | Yes=1, No=0 |
| `clearUseCaseNotes` | Notes | textarea | — |
| `roadmapDisclosed` | Roadmap disclosed with milestones | Yes/No | Yes=1, No=0 |
| `roadmapNotes` | Notes | textarea | — |

---

### Section 04 — Tokenomics

*Weight: 10% of overall score.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `totalSupply` | Total supply | number | — |
| `circulatingSupplyTGE` | Circulating supply at TGE | number | — |
| `distributionAllocation` | Distribution / allocation (founders/investors/treasury) | textarea | — |
| `vestingSchedule` | Vesting schedule for insiders | Yes/No | Yes=1, No=0 |
| `vestingDetails` | Vesting details | textarea | — |
| `mintingBurning` | Minting / Burning mechanism disclosed | Yes/No | Yes=1, No=0 |
| `mintingBurningDetails` | Details | textarea | — |
| `tokenSwapDetails` | Token Swap details (if any) | textarea | — |
| `fundingHistoryDisclosed` | Funding history disclosed (SAFT/IEO/ICO) | Yes/No | Yes=1, No=0 |
| `fundingHistoryDetails` | Details | textarea | — |
| `priceOracleModel` | Price reference / oracle model | Yes/No | Yes=1, No=0 |
| `priceOracleDetails` | Details | textarea | — |
| `pricePerformance` | Price performance and trading volume (secondary market) | textarea | — |
| `tokenUseDescription` | Token use description | textarea | — |
| `privateOfferPrice` | Private offer price | text | — |
| `publicOfferPrice` | Public offer price | text | — |
| `currentPrice` | Current price | text | — |
| `valuation` | Valuation | text | — |

---

### Section 05 — Team & Advisors

*Weight: 5% of overall score.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `teamIdentifiable` | Team members easily identifiable | Yes/No | Yes=1, No=0 |
| `teamIdentifiableNotes` | Notes | textarea | — |
| `teamExperience` | Team members have proven experience, education, knowledge | Yes/No | Yes=1, No=0 |
| `teamExperienceNotes` | Notes | textarea | — |
| `teamTrackRecord` | Team members have proven track record and successful past projects | Yes/No | Yes=1, No=0 |
| `teamTrackRecordNotes` | Notes | textarea | — |
| `advisorsDisclosed` | Advisors disclosed and relevant | Yes/No | Yes=1, No=0 |
| `advisorsNotes` | Notes | textarea | — |
| `teamAllocationPct` | Token allocation to team members (%) | number | — |
| `teamAllocationVesting` | Vesting details for team allocation | textarea | — |
| `otherTeamInfo` | Other available information about the team | textarea | — |

---

### Section 06 — Whitepaper Assessment

*Weight: 15% of overall score. 13 scored Yes/No fields.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `wpIssuerIdentification` | Includes issuer identification (name, reg no., jurisdiction, contacts) | Yes/No | Yes=1, No=0 |
| `wpTokenDescription` | Includes full token description (name, ticker, supply, technology, use case) | Yes/No | Yes=1, No=0 |
| `wpTokenomicsDetails` | Includes tokenomics details | Yes/No | Yes=1, No=0 |
| `wpRightsObligations` | Lists rights and obligations of token holders | Yes/No | Yes=1, No=0 |
| `wpRiskDisclosure` | Contains comprehensive risk disclosure (market, liquidity, tech, regulatory) | Yes/No | Yes=1, No=0 |
| `wpGovernance` | Contains project governance and decision-making structure | Yes/No | Yes=1, No=0 |
| `wpTechnologySecurity` | Contains technology and security features including audits | Yes/No | Yes=1, No=0 |
| `wpUseCase` | Contains detailed use case | Yes/No | Yes=1, No=0 |
| `wpRegulatoryCompliance` | Explains regulatory compliance approach | Yes/No | Yes=1, No=0 |
| `wpTeamAdvisors` | Provides team and advisor skills and experience | Yes/No | Yes=1, No=0 |
| `wpMarketAnalysis` | Includes market analysis (competitors, target audience) | Yes/No | Yes=1, No=0 |
| `wpDisclaimerLegal` | Contains disclaimer and legal information | Yes/No | Yes=1, No=0 |
| `wpRoadmap` | Contains development and adoption roadmap | Yes/No | Yes=1, No=0 |
| `wpComments` | Other relevant comments about the whitepaper | textarea | — |

---

### Section 07 — Community

*Completeness-tracked; not in weighted overall score.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `communitySize` | Community size | number | — |
| `communityPlatforms` | Platforms | text | — |
| `communityEngagement` | Community engagement | select: Low/Medium/High | — |
| `communityEngagementNotes` | Notes | textarea | — |
| `communitySentiment` | Community sentiment | select: Positive/Neutral/Negative | — |
| `communitySentimentNotes` | Notes | textarea | — |
| `bugBountyProgram` | Bug bounty program | Yes/No | Yes=1, No=0 |
| `bugBountyLink` | Bug bounty link | url | — |
| `communityParticipation` | Community participation (code contributions, bug reports, proposals) | Yes/No | Yes=1, No=0 |
| `communityParticipationNotes` | Notes | textarea | — |
| `communityEvents` | Community events | Yes/No | Yes=1, No=0 |
| `communityEventsNotes` | Notes | textarea | — |
| `developerRelations` | Developer Relations / DevRel programs | Yes/No | Yes=1, No=0 |
| `developerRelationsNotes` | Notes | textarea | — |
| `tokenHoldersCount` | Token holders (number) | number | — |
| `tokenHoldersNotes` | Notes | textarea | — |
| `otherCommunityInfo` | Other available information about the community | textarea | — |

---

### Section 08 — AML / Financial Crime

*Weight: 20% of overall score.*

| Field Key | Label | Type | Scoring | Inverted? |
|---|---|---|---|---|
| `fitTestResult` | FIT test classification result | text | — | — |
| `inbuiltAnonymisation` | Inbuilt anonymisation function | Yes/No | Yes=0, No=1 | ✓ |
| `holdersIdentifiable` | If yes: can holders and transaction history be identified by CASPs | Yes/No/N/A | Yes=1, No=0, N/A=excl | — |
| `blockchainAnalyticsTools` | Supported by deployed blockchain analytics tools | Yes/No | Yes=1, No=0 | — |
| `blockchainAnalyticsToolName` | Tool name | text | — | — |
| `transactionsTraceable` | Transactions effectively traced and monitored | Yes/No | Yes=1, No=0 | — |
| `transactionsTraceableNotes` | Notes | textarea | — | — |
| `listedOnExchanges` | Listed on major crypto exchanges | Yes/No | Yes=1, No=0 | — |
| `exchangesList` | List of exchanges | text | — | — |
| `dailyTradingVolume` | Daily trading volume (USD) | number | — | — |
| `illicitActivities` | Involvement in illicit activities | Yes/No | Yes=0, No=1 | ✓ |
| `illicitActivitiesDetails` | Details | textarea | — | — |
| `passiveRevenueRights` | Ownership conveys rights to passive revenue, rate of return, interests, profits, derivatives, or operates as debt/equity | Yes/No | Yes=0, No=1 | ✓ |
| `passiveRevenueNotes` | Notes | textarea | — | — |
| `projectCommitment` | Project understands and commits to working for benefit of users and supports healthy crypto environment | Yes/No | Yes=1, No=0 | — |
| `projectCommitmentNotes` | Notes | textarea | — | — |

---

### Section 09 — Technical Assessment

*Weight: 10% of overall score.*

| Field Key | Label | Type | Scoring | Inverted? |
|---|---|---|---|---|
| `securityIncidents` | Major security incidents applicable to the code | Yes/No | Yes=0, No=1 | ✓ |
| `securityIncidentsDetails` | Details | textarea | — | — |
| `githubReviewed` | GitHub repository reviewed | Yes/No | Yes=1, No=0 | — |
| `githubUrl` | GitHub URL | url | — | — |
| `vulnerabilitiesManaged` | Vulnerabilities and bugs managed and regularly fixed | Yes/No | Yes=1, No=0 | — |
| `vulnerabilitiesNotes` | Notes | textarea | — | — |
| `euIntegration` | Token can be integrated in European ecosystem | Yes/No | Yes=1, No=0 | — |
| `euIntegrationNotes` | Notes | textarea | — | — |
| `smartContractAudit` | Independent smart contract audit performed | Yes/No | Yes=1, No=0 | — |
| `auditorsName` | Auditor name | text | — | — |
| `auditReportLink` | Audit report link | url | — | — |
| `otherTechnicalConcerns` | Other technical concerns | textarea | — | — |

---

### Section 10 — MiCA Compliance

*Weight: 25% of overall score.*

| Field Key | Label | Type | Scoring |
|---|---|---|---|
| `micaClassification` | MiCA classification confirmed | select: EMT/ART/OCA/None | — |
| `reservesVerified` | If EMT or ART: reserves and attestations verified | Yes/No/N/A | Yes=1, No=0, N/A=excl |
| `reservesNotes` | Notes | textarea | — |
| `executionFrameworkAligned` | Execution framework aligned (listing/trading within firm's execution model, commercial model, and best execution framework) | Yes/No | Yes=1, No=0 |
| `executionFrameworkNotes` | Notes | textarea | — |
| `marketAbuseMonitoring` | Market-abuse monitoring configured (token and trading pairs onboarded into market abuse surveillance framework with alert scenarios and thresholds) | Yes/No | Yes=1, No=0 |
| `marketAbuseNotes` | Notes | textarea | — |
| `transparencyPublished` | Transparency and Operating Rules published (client-facing disclosures, token-specific warnings, and applicable Operating Rules published prior to go-live) | Yes/No | Yes=1, No=0 |
| `transparencyNotes` | Notes | textarea | — |
| `significantTokenAssessment` | Significant token assessment completed (if applicable) | Yes/No/N/A | Yes=1, No=0, N/A=excl |
| `significantTokenNotes` | Notes | textarea | — |

---

## 5. Scoring Engine

### 5.1 Section Score

```
scoredFields = fields where answer ∈ {Yes, No}   (N/A excluded)
invertedYes  = fields where inverted=true AND answer=Yes → 0 pts
               fields where inverted=true AND answer=No  → 1 pt
points       = Σ (answer=Yes AND !inverted ? 1 : answer=No AND inverted ? 1 : 0)
sectionScore = (points / scoredFields.length) × 100
```

### 5.2 Overall Score

```
overallScore = Σ (sectionScore[s] × weight[s]) / Σ weight[s]
```

Sections without a weight (S01, S03, S07) do not contribute to overallScore.

### 5.3 Flag

| overallScore | Flag |
|---|---|
| > 75 | **PASS** |
| 50–75 | **REVIEW** |
| < 50 | **FAIL** |

---

## 6. Dashboard

- Table columns: Token Name, Ticker, Status, Overall Score, Flag, Created By, Created Date, Actions
- Filters: Status, Flag, Date Range
- Sort: Date (desc default), Score
- Actions per row: View, Edit (DRAFT only), Export PDF (APPROVED/SUBMITTED), Delete (ADMIN)
- Score ring / progress bar per row for quick visual scanning
- Summary cards at top: Total assessments, PASS count, REVIEW count, FAIL count

---

## 7. Assessment Report Page

Read-only view of a completed assessment showing:
- Header: token name, ticker, classification, status badge, overall score ring
- Section-by-section accordion with all field values
- Score breakdown table
- Reviewer notes (if reviewed)
- Export to PDF button

---

## 8. PDF Report Structure

1. **Cover page** — Zulia Networks logo, token name + ticker, assessment date, overall score, flag, analyst name
2. **Executive Summary** — score table (section, score, weight, contribution), overall score, flag rationale
3. **Sections 1–10** — each section on its own page with field labels, answers, and notes
4. **Conclusion** — MiCA classification, key findings, recommended next steps
5. **Footer** — confidential, Zulia Networks, page numbers

---

## 9. Non-Functional Requirements

- Response time < 2 s for all page loads (server components with DB queries)
- PDF generation < 10 s
- All form state persisted on every section save; no data loss on navigation
- WCAG 2.1 AA for all interactive elements
- All user actions logged to `AuditLog`
- Passwords stored as bcrypt hash (saltRounds=12)
- API routes validate session and role before every DB operation
