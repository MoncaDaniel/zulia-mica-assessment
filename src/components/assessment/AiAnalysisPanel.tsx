"use client";
/**
 * AiAnalysisPanel
 *
 * Floats above the section wizard. The analyst enters 1–5 source URLs
 * (whitepaper, website, GitHub, etc.) and clicks "Analyze".
 * After ~20–30 s Claude's suggestions are loaded into every field.
 */
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { AiSectionData } from "@/lib/ai/types";

interface AiAnalysisPanelProps {
  assessmentId: string;
  aiStatus: string;          // NONE | PENDING | COMPLETED | FAILED
  aiNarrative: string | null;
  initialUrls: string[];
  onComplete: (sections: Record<string, AiSectionData>, narrative: string) => void;
}

export function AiAnalysisPanel({
  assessmentId,
  aiStatus: initialStatus,
  aiNarrative: initialNarrative,
  initialUrls,
  onComplete,
}: AiAnalysisPanelProps) {
  const [status, setStatus]       = useState(initialStatus);
  const [narrative, setNarrative] = useState<string | null>(initialNarrative);
  const [urls, setUrls]           = useState<string[]>(
    initialUrls.length > 0 ? initialUrls : [""],
  );
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState(status !== "COMPLETED");

  const addUrl    = () => setUrls((u) => [...u, ""]);
  const removeUrl = (i: number) => setUrls((u) => u.filter((_, idx) => idx !== i));
  const updateUrl = (i: number, v: string) =>
    setUrls((u) => u.map((u2, idx) => (idx === i ? v : u2)));

  const validUrls = urls.map((u) => u.trim()).filter(Boolean);

  async function handleAnalyze() {
    if (validUrls.length === 0) return;
    setStatus("PENDING");
    setError(null);

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrls: validUrls }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("FAILED");
        setError(json.detail ?? json.error ?? "Analysis failed");
        return;
      }

      setStatus("COMPLETED");
      setNarrative(json.aiNarrative ?? null);
      setExpanded(false);
      onComplete(json.sections ?? {}, json.aiNarrative ?? "");
    } catch (err: unknown) {
      setStatus("FAILED");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border mb-4 transition-colors",
        status === "COMPLETED"
          ? "border-indigo-700/50 bg-indigo-950/30"
          : status === "FAILED"
          ? "border-red-700/50 bg-red-950/20"
          : "border-slate-700 bg-slate-900",
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left"
      >
        <span className="text-lg">🤖</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            AI Pre-fill{" "}
            {status === "COMPLETED" && (
              <span className="ml-2 text-xs font-normal text-indigo-400">✓ Analysis complete — suggestions loaded</span>
            )}
            {status === "PENDING" && (
              <span className="ml-2 text-xs font-normal text-yellow-400 animate-pulse">Analyzing…</span>
            )}
            {status === "FAILED" && (
              <span className="ml-2 text-xs font-normal text-red-400">Analysis failed</span>
            )}
          </p>
          {status === "NONE" && !expanded && (
            <p className="text-xs text-slate-500">Enter source URLs to auto-fill all 80+ fields with Claude</p>
          )}
        </div>
        <span className="text-slate-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-800">
          {/* Narrative (if completed) */}
          {status === "COMPLETED" && narrative && (
            <div className="mt-4 p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/40">
              <p className="text-xs font-semibold text-indigo-300 mb-1">AI Compliance Narrative</p>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{narrative}</p>
            </div>
          )}

          {/* Error */}
          {status === "FAILED" && error && (
            <div className="mt-4 p-3 bg-red-950/40 rounded-lg border border-red-800/40">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* URL inputs */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-400">
              Source URLs{" "}
              <span className="text-slate-600">(whitepaper, website, GitHub, CoinMarketCap…)</span>
            </p>
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder="https://…"
                  disabled={status === "PENDING"}
                  className={cn(
                    "flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200",
                    "placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500",
                    "disabled:opacity-50",
                  )}
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    disabled={status === "PENDING"}
                    className="text-slate-600 hover:text-red-400 transition-colors px-2 disabled:opacity-40"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {urls.length < 5 && (
              <button
                type="button"
                onClick={addUrl}
                disabled={status === "PENDING"}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-40"
              >
                + Add another URL
              </button>
            )}
          </div>

          {/* Analyze button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={status === "PENDING" || validUrls.length === 0}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-indigo-600 hover:bg-indigo-500 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {status === "PENDING" ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : status === "COMPLETED" ? (
                "Re-analyze"
              ) : (
                "Analyze with AI"
              )}
            </button>
            <p className="text-xs text-slate-500">
              ~20–30 s · Claude will pre-fill all sections · you review & correct
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
