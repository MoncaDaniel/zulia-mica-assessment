export interface MicaItem {
  key: string;
  label: string;
  articleRef: string;
  artOnly?: boolean; // if true, only applicable to Asset-Referenced Tokens
}

export interface MicaGroup {
  key: string;
  label: string;
  articleRef: string;
  scope: string;
  weight: number; // contribution to overall score (all weights sum to 1.0)
  items: MicaItem[];
}

export const MICA_GROUPS: MicaGroup[] = [
  {
    key: "g01_offeror",
    label: "Offeror / person seeking admission to trading",
    articleRef: "Art. 6(1)(a) + Annex I §1",
    scope: "All token types",
    weight: 0.08,
    items: [
      { key: "legalName",          label: "Legal name of the offeror",                                              articleRef: "Art. 6(1)(a)" },
      { key: "registeredAddress",  label: "Registered office address",                                               articleRef: "Annex I §1" },
      { key: "lei",                label: "Legal Entity Identifier (LEI), if already assigned",                      articleRef: "Annex I §1" },
      { key: "managementBody",     label: "Names of all members of the management body",                             articleRef: "Art. 6(1)(a)" },
      { key: "shareholders20pct",  label: "Identity of all shareholders holding more than 20% of voting rights or capital", articleRef: "Art. 6(1)(a)" },
      { key: "businessActivities", label: "Description of the offeror's business activities",                        articleRef: "Annex I §1" },
    ],
  },
  {
    key: "g02_issuer",
    label: "Issuer (if different from offeror)",
    articleRef: "Art. 6(1)(b) + Annex I §2",
    scope: "All token types",
    weight: 0.03,
    items: [
      { key: "issuerLegalName",    label: "Legal name of the issuer",                           articleRef: "Art. 6(1)(b)" },
      { key: "issuerAddress",      label: "Registered office address of the issuer",            articleRef: "Annex I §2" },
      { key: "issuerLei",          label: "LEI of the issuer, if assigned",                     articleRef: "Annex I §2" },
      { key: "issuerManagement",   label: "Names of management body members of the issuer",     articleRef: "Art. 6(1)(b)" },
    ],
  },
  {
    key: "g03_project",
    label: "Description of the crypto-asset project",
    articleRef: "Art. 6(1)(c) + Annex I §3",
    scope: "All token types",
    weight: 0.10,
    items: [
      { key: "purpose",            label: "Purpose of the crypto-asset",                                          articleRef: "Art. 6(1)(c)" },
      { key: "intendedUse",        label: "Intended use of the crypto-asset",                                     articleRef: "Art. 6(1)(c)" },
      { key: "mainFeatures",       label: "Main features and functions",                                          articleRef: "Annex I §3" },
      { key: "dltType",            label: "Type of DLT or similar technology used",                               articleRef: "Annex I §3" },
      { key: "consensus",          label: "Consensus mechanism",                                                  articleRef: "Annex I §3" },
      { key: "supplyOrCap",        label: "Total supply or issuance cap (or statement that supply is unlimited)", articleRef: "Annex I §3" },
      { key: "smartContractAddr",  label: "Smart contract address or technical reference (if applicable)",        articleRef: "Annex I §3" },
      { key: "auditResults",       label: "Results of any smart contract audit (if applicable)",                  articleRef: "Annex I §3" },
      { key: "sourceCode",         label: "Source code availability or reference (if applicable)",               articleRef: "Annex I §3" },
    ],
  },
  {
    key: "g04_offer_terms",
    label: "Terms of the offer to the public / admission to trading",
    articleRef: "Art. 6(1)(d) + Annex I §4",
    scope: "All token types",
    weight: 0.06,
    items: [
      { key: "reasonsForOffer",    label: "Reasons for the offer and intended use of proceeds",     articleRef: "Art. 6(1)(d)" },
      { key: "totalAmount",        label: "Total amount of the public offer",                        articleRef: "Annex I §4" },
      { key: "issuePrice",         label: "Issue price or, if not fixed, the price-setting method", articleRef: "Annex I §4" },
      { key: "subscriptionPeriod", label: "Subscription period and allocation method",               articleRef: "Annex I §4" },
      { key: "offerDates",         label: "Offer start date and end date",                           articleRef: "Annex I §4" },
      { key: "lockupVesting",      label: "Lock-up or vesting periods (if applicable)",              articleRef: "Annex I §4" },
      { key: "jurisdictionRestr",  label: "Jurisdiction-specific restrictions on the offer (if applicable)", articleRef: "Annex I §4" },
    ],
  },
  {
    key: "g05_rights",
    label: "Rights and obligations attached to the crypto-asset",
    articleRef: "Art. 6(1)(e) + Annex I §5",
    scope: "All token types",
    weight: 0.11,
    items: [
      { key: "rightsDescription",  label: "Description of all rights attached to the token",                           articleRef: "Art. 6(1)(e)" },
      { key: "redemptionRights",   label: "Redemption rights and procedure (if applicable)",                           articleRef: "Annex I §5" },
      { key: "governanceRights",   label: "Governance and voting rights (if applicable)",                               articleRef: "Annex I §5" },
      { key: "economicRights",     label: "Economic rights: revenue share, dividends, or similar (if applicable)",     articleRef: "Annex I §5" },
      { key: "transferRestr",      label: "Restrictions on transferability",                                            articleRef: "Annex I §5" },
      { key: "custodyArrangements",label: "Custody arrangements for holders",                                           articleRef: "Annex I §5" },
      { key: "withdrawalRight",    label: "14-day right of withdrawal for retail investors (or statement of inapplicability)", articleRef: "Art. 14" },
    ],
  },
  {
    key: "g06_technology",
    label: "Underlying technology",
    articleRef: "Art. 6(1)(f) + Annex I §6",
    scope: "All token types",
    weight: 0.10,
    items: [
      { key: "protocolDescription",label: "Description of the protocol and technical infrastructure",     articleRef: "Art. 6(1)(f)" },
      { key: "securityMeasures",   label: "Security measures and controls",                               articleRef: "Annex I §6" },
      { key: "thirdPartyDeps",     label: "Third-party dependencies and infrastructure providers",         articleRef: "Annex I §6" },
      { key: "updateProcedure",    label: "Procedure for updating or modifying the protocol",             articleRef: "Annex I §6" },
    ],
  },
  {
    key: "g07_risks",
    label: "Risk factors",
    articleRef: "Art. 6(1)(g) + Annex I §7",
    scope: "All token types",
    weight: 0.14,
    items: [
      { key: "issuerRisks",        label: "Risks specific to the issuer or offeror",                                 articleRef: "Art. 6(1)(g)" },
      { key: "assetRisks",         label: "Risks specific to the crypto-asset itself",                               articleRef: "Annex I §7" },
      { key: "techRisks",          label: "Technology and smart contract risks",                                     articleRef: "Annex I §7" },
      { key: "marketRisks",        label: "Market and liquidity risks",                                              articleRef: "Annex I §7" },
      { key: "regulatoryRisks",    label: "Regulatory and legal risks",                                              articleRef: "Annex I §7" },
      { key: "operationalRisks",   label: "Operational and counterparty risks",                                      articleRef: "Annex I §7" },
      { key: "projectSpecific",    label: "Risks are specific to the project — not generic boilerplate",             articleRef: "Art. 6(2)" },
    ],
  },
  {
    key: "g08_sustainability",
    label: "Principal adverse sustainability impacts",
    articleRef: "Art. 6(1)(h) + Del. Reg. (EU) 2025/422",
    scope: "All token types · mandatory since 30 June 2024",
    weight: 0.07,
    items: [
      { key: "energyConsumption",  label: "Energy consumption (kWh per transaction or annualised)",             articleRef: "Art. 6(1)(h)" },
      { key: "energySources",      label: "Breakdown of energy sources (% renewable vs non-renewable)",         articleRef: "Del. Reg. 2025/422" },
      { key: "climateImpacts",     label: "Climate-related adverse impacts",                                     articleRef: "Del. Reg. 2025/422" },
      { key: "otherEnvImpacts",    label: "Other environmental adverse impacts",                                 articleRef: "Del. Reg. 2025/422" },
      { key: "methodology",        label: "Methodology and data sources used for the above disclosures",        articleRef: "Del. Reg. 2025/422" },
    ],
  },
  {
    key: "g09_reserves",
    label: "Reserve of assets",
    articleRef: "Art. 19 + Annex II",
    scope: "Asset-Referenced Tokens (ART) only",
    weight: 0.04,
    items: [
      { key: "reserveComposition", label: "Composition of the reserve asset basket",                artOnly: true, articleRef: "Art. 19(1)(a)" },
      { key: "custodyReserves",    label: "Custody and segregation arrangements for reserve assets", artOnly: true, articleRef: "Art. 19(1)(b)" },
      { key: "investmentPolicy",   label: "Investment policy governing the reserve",                 artOnly: true, articleRef: "Art. 19(1)(c)" },
      { key: "stabilisation",      label: "Description of the stabilisation mechanism",              artOnly: true, articleRef: "Art. 19(1)(d)" },
      { key: "redemptionRebalance",label: "Redemption and rebalancing procedures",                   artOnly: true, articleRef: "Art. 19(1)(e)" },
    ],
  },
  {
    key: "g10_format",
    label: "Format and presentation requirements",
    articleRef: "Art. 6(8)(9) + Implementing Reg. (EU) 2024/2984",
    scope: "All token types",
    weight: 0.08,
    items: [
      { key: "tableOfContents",    label: "Table of contents present",                                                  articleRef: "Art. 6(8)" },
      { key: "notificationDate",   label: "Notification date included in the document",                                  articleRef: "Art. 6(9)" },
      { key: "euLanguage",         label: "Written in an official EU language or a language customary in international finance", articleRef: "Art. 6(8)" },
      { key: "clearLanguage",      label: "Clear, concise, and non-technical language accessible to an average investor", articleRef: "Art. 6(8)" },
      { key: "termsExplained",     label: "Technical terms are defined or explained",                                    articleRef: "Art. 6(8)" },
      { key: "noFutureValue",      label: "No assertions about future value of the crypto-asset",                        articleRef: "Art. 6(4)" },
      { key: "mandatoryDisclaimer",label: "Mandatory disclaimer present: 'This white paper has not been approved by any competent authority…'", articleRef: "Art. 6(5)" },
      { key: "signedByMgmt",       label: "Signed or approved by the management body",                                  articleRef: "Art. 6(9)" },
    ],
  },
  {
    key: "g11_prohibited",
    label: "Prohibited content",
    articleRef: "Art. 6(2)(4)",
    scope: "All token types",
    weight: 0.17,
    items: [
      { key: "noMaterialOmissions",label: "No material omissions of information relevant to investors",                      articleRef: "Art. 6(2)" },
      { key: "noMisleading",       label: "No misleading, unfair, or inaccurate statements",                                 articleRef: "Art. 6(2)" },
      { key: "noPriceForecasts",   label: "No price forecasts or future value guarantees",                                   articleRef: "Art. 6(4)" },
      { key: "marketingConsistent",label: "Marketing communications are clearly identified and consistent with the whitepaper", articleRef: "Art. 7" },
    ],
  },
  {
    key: "g12_procedural",
    label: "Procedural obligations",
    articleRef: "Art. 8–9",
    scope: "All token types",
    weight: 0.02,
    items: [
      { key: "ncaNotification",    label: "Whitepaper notified to the NCA at least 20 working days before the public offer (40 days for ART/EMT)", articleRef: "Art. 8(1)" },
      { key: "websitePublication", label: "Whitepaper published on the issuer's website on or before the offer start date", articleRef: "Art. 9(1)" },
      { key: "classificationNote", label: "Token classification note prepared and submitted with the filing",                articleRef: "Del. Reg. 2025/421" },
      { key: "updateProcedureSet", label: "Procedure in place to update the whitepaper for any material change",            articleRef: "Art. 12" },
    ],
  },
];

// Ordered group keys — matches Claude's output order for stream detection
export const GROUP_STREAM_ORDER = MICA_GROUPS.map((g) => g.key);

// Flat map of groupKey → group for quick lookup
export const MICA_GROUP_MAP = Object.fromEntries(MICA_GROUPS.map((g) => [g.key, g]));

// Total item count across all groups
export const TOTAL_ITEMS = MICA_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
