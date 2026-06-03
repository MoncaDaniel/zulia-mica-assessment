import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

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
  fieldRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  fieldLabel: { width: "40%", color: "#64748b", fontSize: 8 },
  fieldValue: { flex: 1, color: "#1e293b", fontSize: 8 },
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
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
});

interface ReportSection {
  key: string;
  label: string;
  description: string;
  score: number | null;
  weight: number | null;
  data: Record<string, string>;
  completedAt: Date | null;
}

interface ReportDocumentProps {
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  reviewerNotes: string | null;
  createdAt: string;
  analystName: string;
  reviewerName: string | null;
  sections: ReportSection[];
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
  return "#ef4444";
}

function formatFieldKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function PageFooter({ pageNum, tokenName }: { pageNum: number; tokenName: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>CONFIDENTIAL — Zulia Networks LLC | MiCA Token Assessment</Text>
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
  createdAt,
  analystName,
  reviewerName,
  sections,
}: ReportDocumentProps) {
  return (
    <Document
      title={`MiCA Assessment — ${tokenName}`}
      author="Zulia Networks LLC"
      subject="MiCA Compliance Assessment Report"
    >
      {/* Cover Page */}
      <Page size="A4" style={{ ...styles.page, padding: 0 }}>
        <View style={styles.coverPage}>
          <View>
            <Text style={styles.coverLogo}>Zulia Networks</Text>
            <Text style={{ color: "#475569", fontSize: 10, marginTop: 4 }}>MiCA Token Assessment Platform</Text>
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
            CONFIDENTIAL — This report has been prepared by Zulia Networks LLC for internal compliance purposes only.
            It does not constitute legal or investment advice. © Zulia Networks LLC 2024.
          </Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#FF7A00" }}>Zulia Networks</Text>
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

        {/* Score Table */}
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 8 }}>Score Breakdown by Section</Text>
        <View style={styles.scoreTable}>
          <View style={[styles.scoreRow, styles.scoreRowHeader]}>
            <Text style={[styles.scoreCol1, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Section</Text>
            <Text style={[styles.scoreCol2, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Weight</Text>
            <Text style={[styles.scoreCol3, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Score</Text>
            <Text style={[styles.scoreCol4, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Contribution</Text>
          </View>
          {sections
            .filter((s) => s.weight != null)
            .map((s) => {
              const contribution = s.score != null && s.weight != null
                ? `${Math.round(s.score * s.weight)}%`
                : "—";
              return (
                <View key={s.key} style={styles.scoreRow}>
                  <Text style={[styles.scoreCol1, { fontSize: 8 }]}>{s.label}</Text>
                  <Text style={[styles.scoreCol2, { fontSize: 8 }]}>{s.weight != null ? `${Math.round(s.weight * 100)}%` : "—"}</Text>
                  <Text style={[styles.scoreCol3, { fontSize: 8, color: scoreColor(s.score), fontFamily: "Helvetica-Bold" }]}>
                    {s.score != null ? `${Math.round(s.score)}%` : "—"}
                  </Text>
                  <Text style={[styles.scoreCol4, { fontSize: 8 }]}>{contribution}</Text>
                </View>
              );
            })}
        </View>

        {reviewerNotes && (
          <View style={{ backgroundColor: "#fefce8", padding: 12, borderRadius: 6, borderWidth: 1, borderColor: "#fde047", marginTop: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4, color: "#713f12" }}>Reviewer Notes</Text>
            <Text style={{ fontSize: 8, color: "#713f12" }}>{reviewerNotes}</Text>
          </View>
        )}

        <PageFooter pageNum={2} tokenName={tokenName} />
      </Page>

      {/* One page per section */}
      {sections.map((section) => {
        const entries = Object.entries(section.data).filter(([, v]) => v != null && String(v).trim() !== "");

        return (
          <Page key={section.key} size="A4" style={styles.page}>
            <View style={styles.pageHeader}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#FF7A00" }}>Zulia Networks</Text>
              <Text style={{ fontSize: 8, color: "#94a3b8" }}>{tokenName} — {section.label}</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>{section.label}</Text>
              {section.score != null && (
                <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: scoreColor(section.score) }}>
                  {Math.round(section.score)}%
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 12 }}>{section.description}</Text>

            {entries.length === 0 ? (
              <Text style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 8 }}>No data recorded for this section.</Text>
            ) : (
              entries.map(([key, value]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{formatFieldKey(key)}</Text>
                  <Text style={styles.fieldValue}>{String(value)}</Text>
                </View>
              ))
            )}

            <PageFooter pageNum={0} tokenName={tokenName} />
          </Page>
        );
      })}

      {/* Conclusion */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: "#FF7A00" }}>Zulia Networks</Text>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>MiCA Assessment — {tokenName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Conclusion & Recommended Next Steps</Text>

        <View style={{ backgroundColor: "#f8fafc", padding: 16, borderRadius: 6, marginBottom: 16 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Assessment Outcome</Text>
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            This MiCA token assessment has been completed in accordance with EU Regulation 2023/1114 (Markets in Crypto-Assets).
            The token {tokenName}{ticker ? ` (${ticker})` : ""} received an overall compliance score of{" "}
            {overallScore != null ? `${Math.round(overallScore)}%` : "N/A"}, resulting in a {flag ?? "pending"} classification.
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
            The token requires additional review before listing. Recommended actions: (1) Address gaps identified in scored sections;
            (2) Request supplementary documentation from the issuer; (3) Re-assess after remediation; (4) Escalate to senior compliance officer.
          </Text>
        )}
        {flag === "FAIL" && (
          <Text style={{ fontSize: 8, lineHeight: 1.6, color: "#475569" }}>
            The token does not meet minimum MiCA compliance thresholds. Recommended actions: (1) Do not proceed with listing until critical gaps are resolved;
            (2) Inform the issuer of specific deficiencies; (3) Request a full remediation plan; (4) Re-assess after material improvements are confirmed.
          </Text>
        )}

        <View style={{ marginTop: 40, paddingTop: 24, borderTopWidth: 1, borderTopColor: "#e2e8f0" }}>
          <Text style={{ fontSize: 8, color: "#94a3b8" }}>
            This report was prepared by {analystName} on {createdAt}.
            {reviewerName ? ` Reviewed by ${reviewerName}.` : ""}
          </Text>
          <Text style={{ fontSize: 7, color: "#cbd5e1", marginTop: 8 }}>
            DISCLAIMER: This assessment is for internal compliance purposes only and does not constitute legal, financial, or investment advice.
            Zulia Networks LLC is not responsible for decisions made on the basis of this report.
          </Text>
        </View>

        <PageFooter pageNum={0} tokenName={tokenName} />
      </Page>
    </Document>
  );
}
