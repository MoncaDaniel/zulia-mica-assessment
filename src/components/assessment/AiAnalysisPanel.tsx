"use client";
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { SECTION_DEFINITIONS } from "@/lib/scoring";
import type { AiSectionData } from "@/lib/ai/types";

// The 9 sections Claude analyses (s01 is manual)
const AI_SECTIONS = SECTION_DEFINITIONS.filter((s) => s.key !== "s01_general_info");

type SectionStatus = "pending" | "active" | "complete";
type PanelStatus   = "idle" | "fetching" | "analysing" | "complete" | "failed";

interface StreamEvent {
  type: "fetching" | "section_complete" | "narrative_complete" | "done" | "error";
  sectionKey?: string;
  data?: AiSectionData;
  narrative?: string;
  tokensUsed?: number;
  message?: string;
}

interface AiAnalysisPanelProps {
  assessmentId: string;
  aiStatus:     string;
  aiNarrative:  string | null;
  initialUrls:  string[];
  onComplete:   (sections: Record<string, AiSectionData>, narrative: string) => void;
}

export function AiAnalysisPanel({
  assessmentId,
  aiStatus:     initialStatus,
  aiNarrative:  initialNarrative,
  initialUrls,
  onComplete,
}: AiAnalysisPanelProps) {
  const alreadyDone = initialStatus === "COMPLETED";

  const [panelStatus, setPanelStatus] = useState<PanelStatus>(
    alreadyDone ? "complete" : "idle",
  );
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>(() => {
    if (alreadyDone) {
      return Object.fromEntries(AI_SECTIONS.map((s) => [s.key, "complete"]));
    }
    return {};
  });
  const [narrative, setNarrative]   = useState<string | null>(initialNarrative);
  const [urls, setUrls]             = useState<string[]>(
    initialUrls.length > 0 ? initialUrls : [""],
  );
  const [error, setError]           = useState<string | null>(null);
  const [expanded, setExpanded]     = useState(!alreadyDone);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  const collectedSections = useRef<Record<string, AiSectionData>>({});

  const validUrls = urls.map((u) => u.trim()).filter(Boolean);

  const completedCount = Object.values(sectionStatuses).filter((s) => s === "complete").length;

  function getSectionStatus(key: string): SectionStatus {
    if (sectionStatuses[key] === "complete") return "complete";
    // The first non-complete section is "active" while analysing
    if (panelStatus === "analysing" || panelStatus === "fetching") {
      const firstPending = AI_SECTIONS.find((s) => sectionStatuses[s.key] !== "complete");
      if (firstPending?.key === key) return "active";
    }
    return "pending";
  }

  async function handleAnalyse() {
    if (validUrls.length === 0) return;

    collectedSections.current = {};
    setPanelStatus("fetching");
    setSectionStatuses({});
    setError(null);
    setNarrative(null);

    let res: Response;
    try {
      res = await fetch(`/api/assessments/${assessmentId}/analyze`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sourceUrls: validUrls }),
      });
    } catch (err) {
      setPanelStatus("failed");
      setError(err instanceof Error ? err.message : "Network error");
      return;
    }

    if (!res.ok || !res.body) {
      setPanelStatus("failed");
      setError(`Server error ${res.status}`);
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text  = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;
            handleStreamEvent(event);
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setPanelStatus("failed");
      setError(err instanceof Error ? err.message : "Stream interrupted");
    }
  }

  function handleStreamEvent(event: StreamEvent) {
    switch (event.type) {
      case "fetching":
        setPanelStatus("fetching");
        break;

      case "section_complete": {
        const key = event.sectionKey!;
        const data = event.data!;
        collectedSections.current[key] = data;
        setSectionStatuses((prev) => ({ ...prev, [key]: "complete" }));
        setPanelStatus("analysing");
        // Feed each section to the wizard as it arrives
        onComplete({ [key]: data }, "");
        break;
      }

      case "narrative_complete":
        setNarrative(event.narrative ?? null);
        break;

      case "done":
        setTokensUsed(event.tokensUsed ?? null);
        setPanelStatus("complete");
        setExpanded(false);
        onComplete(collectedSections.current, narrative ?? "");
        break;

      case "error":
        setPanelStatus("failed");
        setError(event.message ?? "Analysis failed");
        break;
    }
  }

  const isRunning = panelStatus === "fetching" || panelStatus === "analysing";

  return (
    <div
      className={cn(
        "rounded-xl border mb-4 transition-colors duration-300",
        panelStatus === "complete"
          ? "border-slate-700/60 bg-slate-900/60"
          : panelStatus === "failed"
          ? "border-red-800/50 bg-red-950/20"
          : isRunning
          ? "border-slate-700 bg-slate-900"
          : "border-slate-700 bg-slate-900",
      )}
    >
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => !isRunning && setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
        disabled={isRunning}
      >
        {/* Status dot */}
        <span
          className={cn(
            "flex-shrink-0 w-2 h-2 rounded-full",
            panelStatus === "complete"  ? "bg-emerald-500"
            : panelStatus === "failed"  ? "bg-red-500"
            : isRunning                 ? "bg-brand-500 animate-pulse"
            : "bg-slate-600",
          )}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 tracking-tight">
            Whitepaper Analysis
            {panelStatus === "complete" && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                {AI_SECTIONS.length}/{AI_SECTIONS.length} sections complete
                {tokensUsed && ` · ${tokensUsed.toLocaleString()} tokens`}
              </span>
            )}
            {panelStatus === "failed" && (
              <span className="ml-2 text-xs font-normal text-red-400">failed</span>
            )}
          </p>
          {panelStatus === "idle" && !expanded && (
            <p className="text-xs text-slate-600 mt-0.5">
              Claude prefills all {AI_SECTIONS.length} sections · you review &amp; correct
            </p>
          )}
          {isRunning && (
            <p className="text-xs text-slate-500 mt-0.5">
              {panelStatus === "fetching"
                ? "Fetching sources…"
                : `${completedCount} of ${AI_SECTIONS.length} sections`}
            </p>
          )}
        </div>

        {!isRunning && (
          <span className="text-slate-600 text-xs select-none">
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </button>

      {/* ── Progress bar (visible while running) ── */}
      {isRunning && (
        <div className="mx-5 mb-0 h-px bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-700 ease-out"
            style={{ width: `${(completedCount / AI_SECTIONS.length) * 100}%` }}
          />
        </div>
      )}

      {/* ── Body ── */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-800/60">

          {/* Section progress list (shown while running or after completion) */}
          {(isRunning || panelStatus === "complete") && (
            <div className="mt-4 space-y-2">
              {AI_SECTIONS.map((section) => {
                const status = getSectionStatus(section.key);
                return (
                  <div
                    key={section.key}
                    className={cn(
                      "flex items-center gap-3 py-1.5 transition-opacity duration-300",
                      status === "pending" ? "opacity-40" : "opacity-100",
                    )}
                  >
                    {/* Status indicator */}
                    <span className="flex-shrink-0 flex items-center justify-center w-4 h-4">
                      {status === "complete" ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : status === "active" ? (
                        <span className="w-4 h-4 rounded-full border-2 border-brand-500 animate-pulse" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-700" />
                      )}
                    </span>

                    <span
                      className={cn(
                        "text-sm",
                        status === "complete" ? "text-slate-300"
                        : status === "active"  ? "text-slate-200 font-medium"
                        : "text-slate-600",
                      )}
                    >
                      {section.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Narrative — shown when complete */}
          {panelStatus === "complete" && narrative && (
            <div className="mt-5 p-4 bg-slate-950/60 rounded-lg border border-slate-800/60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Executive Summary
              </p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {narrative}
              </p>
            </div>
          )}

          {/* Error */}
          {panelStatus === "failed" && error && (
            <div className="mt-4 p-3 bg-red-950/40 rounded-lg border border-red-800/40">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* URL inputs — shown when idle or failed */}
          {(panelStatus === "idle" || panelStatus === "failed") && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Source URLs
              </p>
              <p className="text-xs text-slate-600">
                Whitepaper, website, GitHub, CoinMarketCap — up to 5 sources
              </p>
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      setUrls((u) => u.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    placeholder="https://…"
                    className={cn(
                      "flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2",
                      "text-sm text-slate-200 placeholder:text-slate-600",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/50",
                    )}
                  />
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setUrls((u) => u.filter((_, idx) => idx !== i))}
                      className="text-slate-600 hover:text-slate-400 transition-colors px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {urls.length < 5 && (
                <button
                  type="button"
                  onClick={() => setUrls((u) => [...u, ""])}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  + Add source
                </button>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAnalyse}
                  disabled={validUrls.length === 0}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-brand-600 hover:bg-brand-500 text-white",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                  )}
                >
                  Analyse Whitepaper
                </button>
                <span className="text-xs text-slate-600">
                  ~20 s · Claude prefills all fields · you review
                </span>
              </div>
            </div>
          )}

          {/* Re-analyse button — shown when complete */}
          {panelStatus === "complete" && (
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => { setPanelStatus("idle"); setExpanded(true); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Re-analyse with different sources
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
