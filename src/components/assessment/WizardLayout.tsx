"use client";
import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SectionNav } from "./SectionNav";
import { ScoreDisplay } from "./ScoreDisplay";
import { AiAnalysisPanel } from "./AiAnalysisPanel";
import { Button } from "@/components/ui/Button";
import { SECTION_DEFINITIONS } from "@/lib/scoring";
import type { SectionKey, SectionData } from "@/types/assessment";
import type { AiSectionData } from "@/lib/ai/types";
import { Section01GeneralInfo } from "@/components/forms/Section01GeneralInfo";
import { Section02IssuerLegal } from "@/components/forms/Section02IssuerLegal";
import { Section03ProjectDescription } from "@/components/forms/Section03ProjectDescription";
import { Section04Tokenomics } from "@/components/forms/Section04Tokenomics";
import { Section05TeamAdvisors } from "@/components/forms/Section05TeamAdvisors";
import { Section06Whitepaper } from "@/components/forms/Section06Whitepaper";
import { Section07Community } from "@/components/forms/Section07Community";
import { Section08AML } from "@/components/forms/Section08AML";
import { Section09Technical } from "@/components/forms/Section09Technical";
import { Section10MiCA } from "@/components/forms/Section10MiCA";

interface SectionInfo {
  sectionKey: string;
  sectionScore: number | null;
  data: Record<string, unknown>;
  aiData: Record<string, AiSectionData[string]>;
  completedAt: Date | null;
}

interface WizardLayoutProps {
  assessmentId: string;
  tokenName: string;
  status: string;
  overallScore: number | null;
  flag: string | null;
  initialSections: SectionInfo[];
  aiStatus: string;
  aiNarrative: string | null;
  aiSourceUrls: string[];
  readOnly?: boolean;
}

export function WizardLayout({
  assessmentId,
  tokenName,
  status,
  overallScore: initialScore,
  flag: initialFlag,
  initialSections,
  aiStatus: initialAiStatus,
  aiNarrative: initialAiNarrative,
  aiSourceUrls,
  readOnly,
}: WizardLayoutProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Per-section state (data + aiData)
  const [sections, setSections] = useState<Record<string, SectionInfo>>(() => {
    const map: Record<string, SectionInfo> = {};
    for (const s of initialSections) {
      map[s.sectionKey] = s;
    }
    return map;
  });

  // AI analysis state — lives here so it survives step navigation
  const [aiSections, setAiSections] = useState<Record<string, AiSectionData>>(() => {
    const map: Record<string, AiSectionData> = {};
    for (const s of initialSections) {
      if (Object.keys(s.aiData).length > 0) {
        map[s.sectionKey] = s.aiData as AiSectionData;
      }
    }
    return map;
  });

  const [overallScore, setOverallScore] = useState(initialScore);
  const [flag, setFlag] = useState(initialFlag);
  const [submitting, setSubmitting] = useState(false);

  const completedSections = new Set(
    Object.values(sections)
      .filter((s) => s.completedAt)
      .map((s) => s.sectionKey),
  );

  const sectionScores: Partial<Record<string, number | null>> = {};
  for (const [key, s] of Object.entries(sections)) {
    sectionScores[key] = s.sectionScore;
  }

  // Called when AI analysis completes — merge into local aiSections state
  const handleAiComplete = useCallback(
    (newSections: Record<string, AiSectionData>, _narrative: string) => {
      setAiSections((prev) => ({ ...prev, ...newSections }));
    },
    [],
  );

  const handleSave = useCallback(
    async (sectionKey: SectionKey, data: SectionData) => {
      const res = await fetch(`/api/assessments/${assessmentId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, data }),
      });

      if (!res.ok) {
        alert("Failed to save section. Please try again.");
        return;
      }

      const { section, sectionScore } = await res.json();
      setSections((prev) => ({
        ...prev,
        [sectionKey]: {
          ...section,
          sectionScore,
          aiData: prev[sectionKey]?.aiData ?? {},
        },
      }));

      if (currentStep < SECTION_DEFINITIONS.length - 1) {
        setCurrentStep((s) => s + 1);
      }
    },
    [assessmentId, currentStep],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: "POST",
    });
    if (res.ok) {
      const updated = await res.json();
      setOverallScore(updated.overallScore);
      setFlag(updated.flag);
      router.push(`/assessments/${assessmentId}/report`);
    } else {
      alert("Failed to submit. Ensure all sections are saved.");
    }
    setSubmitting(false);
  };

  const allSectionsComplete = SECTION_DEFINITIONS.every((s) =>
    completedSections.has(s.key),
  );
  const currentSection = SECTION_DEFINITIONS[currentStep];

  // Build section form props, injecting aiData for the current section
  const formProps = (sectionKey: SectionKey) => ({
    defaultValues: (sections[sectionKey]?.data ?? {}) as Record<string, string>,
    onSave: (data: SectionData) => handleSave(sectionKey, data),
    readOnly,
    aiData: aiSections[sectionKey],
  });

  const SECTION_FORMS: Record<string, React.ReactNode> = {
    s01_general_info: <Section01GeneralInfo {...{ defaultValues: formProps("s01_general_info").defaultValues, onSave: formProps("s01_general_info").onSave, readOnly }} />,
    s02_issuer_legal: <Section02IssuerLegal {...formProps("s02_issuer_legal")} />,
    s03_project_description: <Section03ProjectDescription {...formProps("s03_project_description")} />,
    s04_tokenomics: <Section04Tokenomics {...formProps("s04_tokenomics")} />,
    s05_team_advisors: <Section05TeamAdvisors {...formProps("s05_team_advisors")} />,
    s06_whitepaper: <Section06Whitepaper {...formProps("s06_whitepaper")} />,
    s07_community: <Section07Community {...formProps("s07_community")} />,
    s08_aml: <Section08AML {...formProps("s08_aml")} />,
    s09_technical: <Section09Technical {...formProps("s09_technical")} />,
    s10_mica_compliance: <Section10MiCA {...formProps("s10_mica_compliance")} />,
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Section nav + score */}
      <div className="w-64 shrink-0 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Sections
          </h2>
          <SectionNav
            currentStep={currentStep}
            completedSections={completedSections}
            onNavigate={setCurrentStep}
          />
        </div>

        <div className="px-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Score
          </h3>
          <ScoreDisplay
            overallScore={overallScore}
            flag={flag}
            sectionScores={sectionScores}
          />
        </div>
      </div>

      {/* Right: AI panel + Form */}
      <div className="flex-1 min-w-0">
        {/* AI analysis panel — only shown in DRAFT, not readOnly */}
        {!readOnly && status === "DRAFT" && (
          <AiAnalysisPanel
            assessmentId={assessmentId}
            aiStatus={initialAiStatus}
            aiNarrative={initialAiNarrative}
            initialUrls={aiSourceUrls}
            onComplete={handleAiComplete}
          />
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {currentStep + 1}. {currentSection.label}
              </h2>
              <p className="text-sm text-slate-400">{currentSection.description}</p>
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
                  ← Back
                </Button>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            {SECTION_FORMS[currentSection.key]}
          </div>
        </div>

        {!readOnly && status === "DRAFT" && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={!allSectionsComplete}
              onClick={handleSubmit}
              title={!allSectionsComplete ? "Complete all sections before submitting" : undefined}
            >
              Submit for Review
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
