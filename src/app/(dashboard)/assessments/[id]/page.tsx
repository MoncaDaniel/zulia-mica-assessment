import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentSheet } from "@/components/assessment/DocumentSheet";
import ReviewActions from "./ReviewActions";
import type { MicaGroupData } from "@/lib/ai/types";
import type { CoinFinancials } from "@/lib/ai/coin-data";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function AssessmentPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const assessment = await prisma.assessment.findUnique({
    where:   { id: params.id },
    include: { sections: true },
  });
  if (!assessment) notFound();

  const readOnly =
    assessment.status === "SUBMITTED" ||
    assessment.status === "APPROVED" ||
    (assessment.status === "REJECTED" && session.user.role === "REVIEWER");

  const canReview =
    assessment.status === "SUBMITTED" &&
    (session.user.role === "REVIEWER" || session.user.role === "ADMIN");

  // Reconstruct group data from DB sections
  const initialGroups: Partial<Record<string, MicaGroupData>> = {};
  for (const section of assessment.sections) {
    const aiData = section.aiData as MicaGroupData | null;
    if (aiData && Object.keys(aiData).length > 0) {
      initialGroups[section.sectionKey] = aiData;
    }
  }

  return (
    // Full-bleed layout — override the default p-6 with negative margin trick
    <div className="-m-6">
      {/* Thin top bar */}
      <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-4 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          ← Dashboard
        </Link>
        <span className="text-slate-700 text-sm">/</span>
        <span className="text-slate-300 text-sm font-medium truncate">{assessment.tokenName}</span>
        {assessment.ticker && (
          <span className="text-slate-500 text-xs">{assessment.ticker}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {assessment.status === "APPROVED" && (
            <a href={`/api/assessments/${params.id}/export`} target="_blank" rel="noreferrer">
              <button className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                Export PDF
              </button>
            </a>
          )}
        </div>
      </div>

      {canReview && (
        <div className="px-6 py-4 border-b border-slate-800 bg-amber-500/5">
          <p className="text-xs font-medium text-amber-400 mb-3 uppercase tracking-wide">
            Pending review
          </p>
          <ReviewActions assessmentId={params.id} />
        </div>
      )}

      <DocumentSheet
        assessmentId={params.id}
        tokenName={assessment.tokenName}
        pdfName={(assessment as { pdfName?: string | null }).pdfName ?? null}
        aiStatus={assessment.aiStatus}
        initialGroups={initialGroups}
        initialNarrative={assessment.aiNarrative ?? null}
        initialFinancials={assessment.aiFinancials as CoinFinancials | null}
        readOnly={readOnly}
      />
    </div>
  );
}
