import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge, FlagBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { SECTION_DEFINITIONS, SECTION_WEIGHTS } from "@/lib/scoring";
import { formatDate, formatScore, scoreToColor, cn } from "@/lib/utils";

interface Props {
  params: { id: string };
}

function FieldDisplay({ label, value }: { label: string; value: unknown }) {
  if (value == null || String(value).trim() === "") return null;

  const displayVal = String(value);
  const isYesNo = ["yes", "no", "n/a"].includes(displayVal.toLowerCase());

  return (
    <div className="flex gap-4 py-2 border-b border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 w-64 shrink-0">{label}</span>
      <span className={cn(
        "text-sm flex-1",
        isYesNo && displayVal.toLowerCase() === "yes" ? "text-green-400 font-medium" :
        isYesNo && displayVal.toLowerCase() === "no" ? "text-red-400 font-medium" :
        "text-slate-200"
      )}>
        {displayVal}
      </span>
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
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

  const sectionMap = new Map(assessment.sections.map((s) => [s.sectionKey, s]));

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
        <a href={`/api/assessments/${params.id}/export`} target="_blank" rel="noreferrer">
          <Button variant="primary" size="md">Export PDF</Button>
        </a>
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
              {SECTION_DEFINITIONS.filter((s) => SECTION_WEIGHTS[s.key]).map((section) => {
                const saved = sectionMap.get(section.key);
                const score = saved?.sectionScore ?? null;
                const weight = SECTION_WEIGHTS[section.key]!;

                return (
                  <div key={section.key} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-slate-500 w-8 text-right">{Math.round(weight * 100)}%</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-400 text-xs">{section.label}</span>
                        <span className={cn("font-medium text-xs", scoreToColor(score))}>
                          {formatScore(score)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            score == null ? "w-0" :
                            score > 75 ? "bg-green-500" :
                            score >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${score ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {assessment.reviewerNotes && (
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-300 mb-1">Reviewer Notes</p>
              <p className="text-sm text-amber-200">{assessment.reviewerNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section details */}
      {SECTION_DEFINITIONS.map((section) => {
        const saved = sectionMap.get(section.key);
        const data = (saved?.data ?? {}) as Record<string, unknown>;
        const entries = Object.entries(data).filter(([, v]) => v != null && String(v).trim() !== "");

        return (
          <Card key={section.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{section.label}</h3>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
                {saved?.sectionScore != null && (
                  <span className={cn("text-2xl font-bold font-display", scoreToColor(saved.sectionScore))}>
                    {formatScore(saved.sectionScore)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No data recorded</p>
              ) : (
                <div>
                  {entries.map(([key, value]) => (
                    <FieldDisplay key={key} label={formatKey(key)} value={value} />
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
