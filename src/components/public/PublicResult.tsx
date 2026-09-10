"use client";
import React, { useState } from "react";
import Link from "next/link";
import { DocumentSheet } from "@/components/assessment/DocumentSheet";
import { RequestAnotherForm } from "@/components/public/RequestAnotherForm";
import type { MicaGroupData } from "@/lib/ai/types";
import type { CoinFinancials } from "@/lib/ai/coin-data";

interface Props {
  assessmentId: string;
  tokenName: string;
  pdfName: string | null;
  aiStatus: string;
  initialGroups: Partial<Record<string, MicaGroupData>>;
  initialNarrative: string | null;
  initialFinancials: CoinFinancials | null;
}

export function PublicResult({
  assessmentId,
  tokenName,
  pdfName,
  aiStatus,
  initialGroups,
  initialNarrative,
  initialFinancials,
}: Props) {
  const [done, setDone] = useState(aiStatus === "COMPLETED");
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div>
      <div className="mx-auto max-w-[860px] px-4 pt-6">
        <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-slate-300">
          ← MiCA ESMA
        </Link>
      </div>

      <DocumentSheet
        assessmentId={assessmentId}
        tokenName={tokenName}
        pdfName={pdfName}
        aiStatus={aiStatus}
        initialGroups={initialGroups}
        initialNarrative={initialNarrative}
        initialFinancials={initialFinancials}
        analyzeEndpoint={`/api/public/assessments/${assessmentId}/analyze`}
        onComplete={() => setDone(true)}
      />

      <div className="mx-auto max-w-[860px] px-4 pb-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {done ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">Your full report is ready</p>
                  <p className="mt-1 text-sm text-slate-400">
                    A detailed PDF — every MiCA Annex I item, the whitepaper passages behind each
                    finding, and the token&apos;s market data.
                  </p>
                </div>
                <a
                  href={`/api/public/assessments/${assessmentId}/pdf`}
                  className="shrink-0 rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-500"
                >
                  Download full PDF
                </a>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-5">
                {showRequest ? (
                  <RequestAnotherForm defaultTokenName={tokenName} compact />
                ) : (
                  <p className="text-sm text-slate-400">
                    That was your free assessment.{" "}
                    <button
                      onClick={() => setShowRequest(true)}
                      className="text-brand-400 underline-offset-2 hover:underline"
                    >
                      Request another
                    </button>{" "}
                    or{" "}
                    <a
                      href="https://www.linkedin.com/in/daniel-moncada-leon/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 underline-offset-2 hover:underline"
                    >
                      get in touch
                    </a>
                    .
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Analysis is running — the full PDF download appears here once it finishes. This takes
              about 90 seconds; you can leave this tab open.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Automated analysis, not legal advice. Verify against the official ESMA and national NCA
          MiCA registers before relying on any conclusion.
        </p>
      </div>
    </div>
  );
}
