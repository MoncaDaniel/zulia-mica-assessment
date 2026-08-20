import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { MicaItemFinding } from "@/lib/ai/types";
import { mayPredateMicaArtEmt, MARKET_DATA_DISCLAIMER } from "@/lib/ai/coin-data";
import type { CoinFinancials } from "@/lib/ai/coin-data";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    padding: 40,
  },
  coverPage: {
    backgroundColor: "#0c1220",
    padding: 60,
    flex: 1,
    justifyContent: "space-between",
  },
  coverLogo: { color: "#FF7A00", fontSize: 24, fontFamily: "Helvetica-Bold" },
  coverTitle: { color: "#ffffff", fontSize: 30, fontFamily: "Helvetica-Bold", marginTop: 40 },
  coverTicker: { color: "#94a3b8", fontSize: 16, marginTop: 8 },
  coverMeta: { color: "#94a3b8", fontSize: 10, marginTop: 4 },
  coverScore: { fontSize: 64, fontFamily: "Helvetica-Bold", marginTop: 24 },
  coverFlag: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 8 },
  coverFooter: { color: "#475569", fontSize: 8, borderTopWidth: 1, borderTopColor: "#1e3a5f", paddingTop: 12, marginTop: 24 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#FF7A00",
  },
  itemRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  itemIcon: { width: 12, fontSize: 8, fontFamily: "Helvetica-Bold" },
  itemBody: { flex: 1 },
  itemLabel: { fontSize: 8, color: "#1e293b" },
  itemArticle: { fontSize: 6.5, color: "#94a3b8", marginTop: 1 },
  itemExcerpt: { fontSize: 7.5, color: "#64748b", fontStyle: "italic", marginTop: 2 },
  itemReasoning: { fontSize: 7, color: "#94a3b8", marginTop: 2 },
  scoreTable: {
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  scoreRowHeader: {
    backgroundColor: "#f1f5f9",
  },
  scoreCol1: { width: "45%" },
  scoreCol2: { width: "15%", textAlign: "center" as const },
  scoreCol3: { width: "20%", textAlign: "center" as const },
  scoreCol4: { width: "20%", textAlign: "center" as const },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
  noIssuerNote: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginBottom: 16,
  },
  marketContext: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  cautionNote: {
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 16,
  },
});

interface ReportItem {
  key: string;
  label: string;
  articleRef: string;
  finding: MicaItemFinding | null;
}

interface ReportGroup {
  key: string;
  label: string;
  articleRef: string;
  scope: string;
  weight: number;
  score: number | null; // 0-1 fraction, or null if wholly N/A/unscored
  items: ReportItem[];
}

interface ReportDocumentProps {
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  reviewerNotes: string | null;
  narrative: string | null;
  noIssuerDetected: boolean;
  financials: CoinFinancials | null;
  lowStablecoinDisclosure: boolean;
  createdAt: string;
  analystName: string;
  reviewerName: string | null;
  groups: ReportGroup[];
}

function scoreColor(score: number | null): string {
  if (score == null) return "#94a3b8";
  if (score > 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function flagColor(flag: string | null): string {
  if (flag === "PASS") return "#22c55e";
  if (flag === "REVIEW") return "#f59e0b";
  if (flag === "EXEMPT") return "#0ea5e9";
  return "#ef4444";
}

function ItemStatus({ finding }: { finding: MicaItemFinding | null }) {
  const status = finding?.status ?? "";
  if (status === "found") return <Text style={[styles.itemIcon, { color: "#16a34a" }]}>[Y]</Text>;
  if (status === "not_found") return <Text style={[styles.itemIcon, { color: "#dc2626" }]}>[N]</Text>;
  if (status === "na") return <Text style={[styles.itemIcon, { color: "#94a3b8" }]}>[-]</Text>;
  return <Text style={[styles.itemIcon, { color: "#d97706" }]}>[?]</Text>;
}

function PageFooter({ tokenName }: { tokenName: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>CONFIDENTIAL — MiCA ESMA Assessment Tool</Text>
      <Text>{tokenName}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
    </View>
  );
}

export function ReportDocument({
  tokenName,
  ticker,
  status,
  overallScore,
  flag,
  reviewerNotes,
  narrative,
  noIssuerDetected,
  financials,
  lowStablecoinDisclosure,
  createdAt,
  analystName,
  reviewerName,
  groups,
}: ReportDocumentProps) {
  const fmtM = (n: number | null) =>
    n == null ? "—" : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(0)}M`;
  return (
    <Document
      title={`MiCA Assessment — ${tokenName}`}
      author="MiCA ESMA Assessment Tool"
      subject="MiCA Compliance Assessment Report"
    >
      {/* Cover Page */}
      <Page size="A4" style={{ ...styles.page, padding: 0 }}>
        <View style={styles.coverPage}>
          <View>
            <Text style={styles.coverLogo}>MiCA ESMA</Text>
            <Text style={{ color: "#475569", fontSize: 10, marginTop: 4 }}>Assessment Tool</Text>
          </View>

          <View>
            <Text style={{ color: "#64748b", fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
              COMPLIANCE ASSESSMENT REPORT
            </Text>
            <Text style={styles.coverTitle}>{tokenName}</Text>
            {ticker && <Text style={styles.coverTicker}>{ticker}</Text>}

            <Text style={{ ...styles.coverScore, color: scoreColor(overallScore) }}>
              {overallScore != null ? `${Math.round(overallScore)}%` : "—"}
            </Text>
            {flag && (
              <Text style={{ ...styles.coverFlag, color: flagColor(flag) }}>{flag}</Text>
            )}

            <View style={{ marginTop: 32, gap: 4 }}>
              <Text style={styles.coverMeta}>Assessment Date: {createdAt}</Text>
              <Text style={styles.coverMeta}>Analyst: {analystName}</Text>
              {reviewerName && <Text style={styles.coverMeta}>Reviewer: {reviewerName}</Text>}
              <Text style={styles.coverMeta}>Status: {status}</Text>
            </View>
          </View>

          <Text style={styles.coverFooter}>
            CONFIDENTIAL — This report has been prepared for internal compliance purposes only.
            It does not constitute legal or investment advice.
          </Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#FF7A00" }}>MiCA ESMA Assessment Tool</Text>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>MiCA Assessment — {tokenName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 16, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: scoreColor(overallScore) }}>
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>OVERALL SCORE</Text>
            <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: scoreColor(overallScore) }}>
              {overallScore != null ? `${Math.round(overallScore)}%` : "—"}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 16, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: flagColor(flag) }}>
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>COMPLIANCE FLAG</Text>
            <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: flagColor(flag) }}>{flag ?? "—"}</Text>
          </View>
        </View>

        {noIssuerDetected && (
          <View style={styles.noIssuerNote}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4, color: "#075985" }}>
              No identifiable issuer detected
            </Text>
            <Text style={{ fontSize: 7.5, color: "#075985", lineHeight: 1.5 }}>
              No specific legal entity, company, or foundation could be identified as having created, offered,
              or controlling the issuance of this crypto-asset. Under MiCA Article 4(3) / Recital 22, the Title
              II whitepaper-issuer-disclosure obligations do not attach in this case, so the Offeror, Issuer, and
              Offer Terms groups are excluded from this score rather than scored as non-compliant.
            </Text>
          </View>
        )}

        {lowStablecoinDisclosure && (
          <View style={styles.cautionNote}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4, color: "#78350f" }}>
              Low score does not mean currently prohibited from EU trading
            </Text>
            <Text style={{ fontSize: 7.5, color: "#78350f", lineHeight: 1.5 }}>
              This token&apos;s Reserve of Assets and/or ART Prudential &amp; Recovery Requirements groups scored
              below 50%, meaning the whitepaper document itself does not contain the disclosures MiCA Title III
              requires. That is a statement about this document, not a ruling on the token&apos;s live market
              status — pre-existing tokens may fall under the Art. 143 transitional (&quot;grandfathering&quot;)
              regime, and any exchange listing decision is the CASP&apos;s own compliance call, made independently
              of this whitepaper&apos;s score. Confirm current authorisation status against the ESMA/NCA MiCA
              registers before treating this score as a market-availability verdict.
            </Text>
          </View>
        )}

        {narrative && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Compliance Summary</Text>
            <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>{narrative}</Text>
          </View>
        )}

        {/* Score Table */}
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 8 }}>Score Breakdown by Group</Text>
        <View style={styles.scoreTable}>
          <View style={[styles.scoreRow, styles.scoreRowHeader]}>
            <Text style={[styles.scoreCol1, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Group</Text>
            <Text style={[styles.scoreCol2, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Weight</Text>
            <Text style={[styles.scoreCol3, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Score</Text>
            <Text style={[styles.scoreCol4, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Contribution</Text>
          </View>
          {groups.map((g) => {
            const scorePct = g.score != null ? Math.round(g.score * 100) : null;
            const contribution = scorePct != null ? `${Math.round(g.score! * g.weight * 100)}%` : "excluded";
            return (
              <View key={g.key} style={styles.scoreRow}>
                <Text style={[styles.scoreCol1, { fontSize: 8 }]}>{g.label}</Text>
                <Text style={[styles.scoreCol2, { fontSize: 8 }]}>{Math.round(g.weight * 100)}%</Text>
                <Text style={[styles.scoreCol3, { fontSize: 8, color: scoreColor(scorePct), fontFamily: "Helvetica-Bold" }]}>
                  {scorePct != null ? `${scorePct}%` : "N/A"}
                </Text>
                <Text style={[styles.scoreCol4, { fontSize: 8 }]}>{contribution}</Text>
              </View>
            );
          })}
        </View>

        {financials && (
          <View style={{ ...styles.marketContext, marginTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#0f172a" }}>
                Market Context — {financials.name} ({financials.symbol})
              </Text>
              <Text style={{ fontSize: 6.5, color: "#94a3b8" }}>CoinGecko · informational only</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 6 }}>
              <Text style={{ fontSize: 7.5, color: "#475569" }}>Market Cap: {fmtM(financials.market_cap_usd)}</Text>
              <Text style={{ fontSize: 7.5, color: "#475569" }}>24h Volume: {fmtM(financials.volume_24h_usd)}</Text>
              <Text style={{ fontSize: 7.5, color: "#475569" }}>
                Rank: {financials.market_cap_rank ? `#${financials.market_cap_rank}` : "—"}
              </Text>
              <Text style={{ fontSize: 7.5, color: "#475569" }}>
                Exchanges: {financials.exchanges_listed ?? "—"}
              </Text>
            </View>
            {mayPredateMicaArtEmt(financials) && (
              <Text style={{ fontSize: 7, color: "#b45309", lineHeight: 1.5, marginBottom: 6 }}>
                Possible transitional relief: genesis date ({financials.genesis_date}) predates MiCA Title
                III&apos;s 30 June 2024 application date. If this token is an ART/EMT, it may fall under the
                Art. 143(3)–(4) grandfathering regime rather than requiring immediate whitepaper compliance —
                verify the issuer&apos;s actual transitional status manually.
              </Text>
            )}
            <Text style={{ fontSize: 6.5, color: "#94a3b8", lineHeight: 1.5 }}>{MARKET_DATA_DISCLAIMER}</Text>
          </View>
        )}

        {reviewerNotes && (
          <View style={{ backgroundColor: "#fefce8", padding: 12, borderRadius: 6, borderWidth: 1, borderColor: "#fde047", marginTop: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4, color: "#713f12" }}>Reviewer Notes</Text>
            <Text style={{ fontSize: 8, color: "#713f12" }}>{reviewerNotes}</Text>
          </View>
        )}

        <PageFooter tokenName={tokenName} />
      </Page>

      {/* One page per compliance group */}
      {groups.map((group) => {
        const scorePct = group.score != null ? Math.round(group.score * 100) : null;
        const allNA = group.items.every((i) => i.finding?.status === "na" || i.finding === null);

        return (
          <Page key={group.key} size="A4" style={styles.page}>
            <View style={styles.pageHeader}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#FF7A00" }}>MiCA ESMA Assessment Tool</Text>
              <Text style={{ fontSize: 8, color: "#94a3b8" }}>{tokenName} — {group.label}</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={styles.sectionTitle}>{group.label}</Text>
              {scorePct != null && (
                <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: scoreColor(scorePct) }}>
                  {scorePct}%
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 7.5, color: "#94a3b8", marginBottom: 12 }}>
              {group.articleRef} · {group.scope}
            </Text>

            {allNA ? (
              <Text style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 8 }}>
                All items not applicable for this token type.
              </Text>
            ) : (
              group.items.map((item) => (
                <View key={item.key} style={styles.itemRow}>
                  <ItemStatus finding={item.finding} />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemArticle}>{item.articleRef}</Text>
                    {item.finding?.status === "found" && item.finding.excerpt && (
                      <Text style={styles.itemExcerpt}>&ldquo;{item.finding.excerpt}&rdquo;</Text>
                    )}
                    {item.finding?.status === "not_found" && (
                      <Text style={{ ...styles.itemExcerpt, color: "#dc2626", fontStyle: "normal" }}>
                        Not found in whitepaper
                      </Text>
                    )}
                    {item.finding?.status === "na" && (
                      <Text style={styles.itemExcerpt}>Not applicable</Text>
                    )}
                    {item.finding?.reasoning && (
                      <Text style={styles.itemReasoning}>{item.finding.reasoning}</Text>
                    )}
                  </View>
                </View>
              ))
            )}

            <PageFooter tokenName={tokenName} />
          </Page>
        );
      })}

      {/* Conclusion */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#FF7A00" }}>MiCA ESMA Assessment Tool</Text>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>MiCA Assessment — {tokenName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Conclusion & Recommended Next Steps</Text>

        <View style={{ backgroundColor: "#f8fafc", padding: 16, borderRadius: 6, marginBottom: 16 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Assessment Outcome</Text>
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            This MiCA token assessment has been completed in accordance with EU Regulation 2023/1114 (Markets in Crypto-Assets).
            {flag === "EXEMPT"
              ? `${tokenName}${ticker ? ` (${ticker})` : ""} has no identifiable issuer and falls outside MiCA's Title II whitepaper-disclosure perimeter by design (Art. 4(3) / Recital 22) — no compliance score applies.`
              : `The token ${tokenName}${ticker ? ` (${ticker})` : ""} received an overall compliance score of ${overallScore != null ? `${Math.round(overallScore)}%` : "N/A"}, resulting in a ${flag ?? "pending"} classification.`}
          </Text>
        </View>

        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 8 }}>Recommended Actions</Text>
        {flag === "PASS" && (
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            The token demonstrates strong MiCA alignment. Recommended actions: (1) Continue monitoring whitepaper updates for regulatory changes;
            (2) Maintain reserve attestations if EMT/ART classified; (3) Schedule annual re-assessment; (4) Ensure ongoing market-abuse monitoring.
          </Text>
        )}
        {flag === "REVIEW" && (
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            The token requires additional review before listing. Recommended actions: (1) Address gaps identified in scored groups;
            (2) Request supplementary documentation from the issuer; (3) Re-assess after remediation; (4) Escalate to senior compliance officer.
          </Text>
        )}
        {flag === "FAIL" && (
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            The token does not meet minimum MiCA compliance thresholds. Recommended actions: (1) Do not proceed with listing until critical gaps are resolved;
            (2) Inform the issuer of specific deficiencies; (3) Request a full remediation plan; (4) Re-assess after material improvements are confirmed.
          </Text>
        )}
        {flag === "EXEMPT" && (
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            No whitepaper-disclosure remediation applies — this is not a compliance failure. Recommended actions: (1) If offering trading, custody, or
            brokerage services on this asset to EU clients, confirm the provider holds MiCA CASP authorisation (Title V); (2) Re-assess if the asset later
            gains an identifiable issuer (e.g. a wrapped or issuer-controlled derivative version), since that would not qualify for this exemption;
            (3) No annual re-assessment is required on this basis alone.
          </Text>
        )}

        <View style={{ marginTop: 40, paddingTop: 24, borderTopWidth: 1, borderTopColor: "#e2e8f0" }}>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>
            This report was prepared by {analystName} on {createdAt}.
            {reviewerName ? ` Reviewed by ${reviewerName}.` : ""}
          </Text>
          <Text style={{ fontSize: 7, color: "#cbd5e1", marginTop: 8 }}>
            DISCLAIMER: This assessment is for internal compliance purposes only and does not constitute legal, financial, or investment advice.
            No liability is accepted for decisions made on the basis of this report.
          </Text>
        </View>

        <PageFooter tokenName={tokenName} />
      </Page>
    </Document>
  );
}
