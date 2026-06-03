import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WizardLayout } from "@/components/assessment/WizardLayout";
import Link from "next/link";
import { StatusBadge, FlagBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatScore } from "@/lib/utils";
import ReviewActions from "./ReviewActions";

interface Props {
  params: { id: string };
}

export default async function AssessmentPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      sections: { orderBy: { sectionKey: "asc" } },
    },
  });

  if (!assessment) notFound();

  const isReadOnly =
    assessment.status === "SUBMITTED" ||
    assessment.status === "APPROVED" ||
    (assessment.status === "REJECTED" && session.user.role === "REVIEWER");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm">
          ← Dashboard
        </Link>
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white font-display">
            {assessment.tokenName}
            {assessment.ticker && (
              <span className="ml-2 text-slate-500 font-normal text-base">{assessment.ticker}</span>
            )}
          </h1>
          <StatusBadge status={assessment.status} />
          {assessment.flag && <FlagBadge flag={assessment.flag} />}
          {assessment.overallScore != null && (
            <span className="text-sm text-slate-400">
              Score: <span className="font-bold text-white">{formatScore(assessment.overallScore)}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {assessment.status === "APPROVED" && (
            <a href={`/api/assessments/${params.id}/export`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">Export PDF</Button>
            </a>
          )}
          {(assessment.status === "APPROVED" || assessment.status === "SUBMITTED") && (
            <Link href={`/assessments/${params.id}/report`}>
              <Button variant="secondary" size="sm">View Report</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Reviewer panel for submitted assessments */}
      {assessment.status === "SUBMITTED" && (session.user.role === "REVIEWER" || session.user.role === "ADMIN") && (
        <ReviewPanel assessmentId={params.id} />
      )}

      {/* AI narrative — shown to reviewers and in read-only mode */}
      {assessment.aiStatus === "COMPLETED" && assessment.aiNarrative && isReadOnly && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <p className="text-sm font-semibold text-indigo-300">AI Compliance Narrative</p>
            <span className="ml-auto text-xs text-slate-500">
              Sources: {(assessment.aiSourceUrls as string[]).length} URL{(assessment.aiSourceUrls as string[]).length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {assessment.aiNarrative}
          </p>
        </div>
      )}

      {/* Reviewer notes if rejected */}
      {assessment.status === "REJECTED" && assessment.reviewerNotes && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl">
          <p className="text-sm font-medium text-red-300 mb-1">Rejection Notes</p>
          <p className="text-sm text-red-200">{assessment.reviewerNotes}</p>
        </div>
      )}

      <WizardLayout
        assessmentId={params.id}
        tokenName={assessment.tokenName}
        status={assessment.status}
        overallScore={assessment.overallScore}
        flag={assessment.flag}
        initialSections={assessment.sections.map((s) => ({
          sectionKey: s.sectionKey,
          sectionScore: s.sectionScore,
          data: s.data as Record<string, unknown>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          aiData: (s.aiData ?? {}) as any,
          completedAt: s.completedAt,
        }))}
        aiStatus={assessment.aiStatus}
        aiNarrative={assessment.aiNarrative ?? null}
        aiSourceUrls={(assessment.aiSourceUrls as string[]) ?? []}
        readOnly={isReadOnly}
      />
    </div>
  );
}

function ReviewPanel({ assessmentId }: { assessmentId: string }) {
  return (
    <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
      <p className="text-sm font-medium text-blue-300 mb-3">This assessment is awaiting your review</p>
      <ReviewActions assessmentId={assessmentId} />
    </div>
  );
}

