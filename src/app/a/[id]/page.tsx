import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPublicUserId } from "@/lib/anon";
import { PublicResult } from "@/components/public/PublicResult";
import type { MicaGroupData } from "@/lib/ai/types";
import type { CoinFinancials } from "@/lib/ai/coin-data";

export const metadata: Metadata = {
  title: "MiCA assessment · MiCA ESMA",
  robots: { index: false, follow: false },
};

interface Props {
  params: { id: string };
}

export default async function PublicAssessmentPage({ params }: Props) {
  const publicUserId = await getPublicUserId();

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { sections: true },
  });

  // Only assessments produced by the public/free flow are viewable here.
  if (!assessment || assessment.createdById !== publicUserId) notFound();

  const initialGroups: Partial<Record<string, MicaGroupData>> = {};
  for (const section of assessment.sections) {
    const aiData = section.aiData as MicaGroupData | null;
    if (aiData && Object.keys(aiData).length > 0) {
      initialGroups[section.sectionKey] = aiData;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicResult
        assessmentId={assessment.id}
        tokenName={assessment.tokenName}
        pdfName={assessment.pdfName ?? null}
        aiStatus={assessment.aiStatus}
        initialGroups={initialGroups}
        initialNarrative={assessment.aiNarrative ?? null}
        initialFinancials={assessment.aiFinancials as CoinFinancials | null}
      />
    </div>
  );
}
