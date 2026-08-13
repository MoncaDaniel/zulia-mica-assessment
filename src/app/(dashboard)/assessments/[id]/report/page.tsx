import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge, FlagBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { MICA_GROUPS } from "@/lib/ai/mica-groups";
import { scoreGroup, noIssuerDetected } from "@/lib/ai/scoring";
import type { MicaGroupData, MicaItemFinding } from "@/lib/ai/types";
import { formatDate, formatScore, scoreToColor, cn } from "@/lib/utils";

interface Props {
  params: { id: string };
}

function statusGlyph(status: MicaItemFinding["status"] | undefined) {
  switch (status) {
    case "found":     return { icon: "✓", className: "text-green-400" };
    case "not_found": return { icon: "✗", className: "text-red-400" };
    case "na":        return { icon: "–", className: "text-slate-500" };
    default:          return { icon: "?", className: "text-amber-400" };
  }
}

function ItemDisplay({ label, articleRef, finding }: { label: string; articleRef: string; finding: MicaItemFinding | null }) {
  const { icon, className } = statusGlyph(finding?.status);

  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <span className={cn("shrink-0 w-4 text-sm font-bold mt-0.5", className)}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm text-slate-300">{label}</span>
          <span className="shrink-0 text-[10px] text-slate-600 font-mono mt-0.5">{articleRef}</span>
        </div>
        {finding?.status === "found" && finding.excerpt && (
          <p className="mt-1 text-xs text-slate-500 italic">&ldquo;{finding.excerpt}&rdquo;</p>
        )}
        {finding?.status === "not_found" && (
          <p className="mt-1 text-xs text-red-400">Not found in whitepaper</p>
        )}
        {finding?.status === "na" && (
          <p className="mt-1 text-xs text-slate-500">Not applicable</p>
        )}
        {finding?.reasoning && (
          <p className="mt-1 text-xs text-slate-600">{finding.reasoning}</p>
        )}
      </div>
    </div>
  );
}

export default async function ReportPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      sections: { orderBy: { sectionKey: "asc" } },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { timestamp: "desc" },
        take: 20,
      },
    },
  });

  if (!assessment) notFound();

  const groupMap: Partial<Record<string, MicaGroupData>> = {};
  for (const s of assessment.sections) {
    if (s.aiData) groupMap[s.sectionKey] = s.aiData as unknown as MicaGroupData;
  }

  const groupsWithScores = MICA_GROUPS.map((def) => {
    const data = groupMap[def.key] ?? null;
    return { def, data, score: data ? scoreGroup(data) : null };
  });

  const isExempt = noIssuerDetected(groupMap);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm mt-1">
          ← Dashboard
        </Link>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display text-white">
              {assessment.tokenName}
              {assessment.ticker && (
                <span className="ml-2 text-slate-500 font-normal text-lg">{assessment.ticker}</span>
              )}
            </h1>
            <StatusBadge status={assessment.status} />
            {assessment.flag && <FlagBadge flag={assessment.flag} />}
          </div>
          <p className="text-sm text-slate-400">
            Created by {assessment.createdBy.name} on {formatDate(assessment.createdAt)}
            {assessment.reviewedBy && ` · Reviewed by ${assessment.reviewedBy.name}`}
          </p>
        </div>
        {process.env.DEMO_MODE === "true" ? (
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-slate-500">🔒 Full PDF report available on request</p>
            <div className="flex gap-2">
              <a
                href={
                  "mailto:danielmoncada10@gmail.com" +
                  "?subject=" + encodeURIComponent("MiCA Assessment Platform — Full Report Request") +
                  "&body=" + encodeURIComponent(
                    `Hi Daniel,\n\nI'd like to receive the full PDF report for this MiCA assessment demo (${assessment.tokenName}).\n\n`
                  )
                }
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="md">📧 Email</Button>
              </a>
              <a href="https://www.linkedin.com/in/daniel-moncada-leon/" target="_blank" rel="noreferrer">
                <Button variant="secondary" size="md">💼 LinkedIn</Button>
              </a>
            </div>
          </div>
        ) : (
          <a href={`/api/assessments/${params.id}/export`} target="_blank" rel="noreferrer">
            <Button variant="primary" size="md">Export PDF</Button>
          </a>
        )}
      </div>

      {/* Score summary */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Score Summary</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Overall Score</p>
              <p className={cn("text-5xl font-bold font-display", scoreToColor(assessment.overallScore))}>
                {formatScore(assessment.overallScore)}
              </p>
              {assessment.flag && (
                <p className={cn("text-lg font-bold mt-2", scoreToColor(assessment.overallScore))}>
                  {assessment.flag}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {groupsWithScores.map(({ def, score }) => {
                const scorePct = score != null ? Math.round(score * 100) : null;
                return (
                  <div key={def.key} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-slate-500 w-8 text-right">{Math.round(def.weight * 100)}%</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-400 text-xs">{def.label}</span>
                        <span className={cn("font-medium text-xs", scoreToColor(scorePct))}>
                          {scorePct != null ? `${scorePct}%` : "N/A"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            scorePct == null ? "w-0" :
                            scorePct > 75 ? "bg-green-500" :
                            scorePct >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${scorePct ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isExempt && (
            <div className="mt-4 p-4 bg-sky-900/20 border border-sky-800 rounded-lg">
              <p className="text-sm font-medium text-sky-300 mb-1">No identifiable issuer detected</p>
              <p className="text-sm text-sky-200">
                No specific legal entity, company, or foundation could be identified as having created,
                offered, or controlling the issuance of this crypto-asset. Under MiCA Article 4(3) /
                Recital 22, the Title II whitepaper-issuer-disclosure obligations do not attach in this
                case, so the Offeror, Issuer, and Offer Terms groups are excluded from this score rather
                than scored as non-compliant.
              </p>
            </div>
          )}

          {assessment.aiNarrative && (
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-sm font-medium text-slate-300 mb-1">Compliance Summary</p>
              <p className="text-sm text-slate-400 whitespace-pre-line">{assessment.aiNarrative}</p>
            </div>
          )}

          {assessment.reviewerNotes && (
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-300 mb-1">Reviewer Notes</p>
              <p className="text-sm text-amber-200">{assessment.reviewerNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group details */}
      {groupsWithScores.map(({ def, data, score }) => {
        const scorePct = score != null ? Math.round(score * 100) : null;
        const items = Object.keys(data ?? {}).length > 0 ? def.items : [];
        const allNA = items.length > 0 && items.every((i) => data?.[i.key]?.status === "na");

        return (
          <Card key={def.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{def.label}</h3>
                  <p className="text-xs text-slate-500">{def.articleRef} · {def.scope}</p>
                </div>
                {scorePct != null && (
                  <span className={cn("text-2xl font-bold font-display", scoreToColor(scorePct))}>
                    {scorePct}%
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Not yet analysed</p>
              ) : allNA ? (
                <p className="text-slate-500 text-sm italic">All items not applicable for this token type.</p>
              ) : (
                <div>
                  {def.items.map((item) => (
                    <ItemDisplay
                      key={item.key}
                      label={item.label}
                      articleRef={item.articleRef}
                      finding={data?.[item.key] ?? null}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Audit log */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Audit Log</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assessment.auditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="text-slate-600 text-xs font-mono">{formatDate(log.timestamp)}</span>
                <span className="text-slate-300">{log.user.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">{log.action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
