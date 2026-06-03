"use client";
/**
 * AiSuggestionBadge
 *
 * Shown below a Yes/No/NA field when Claude has a suggestion for that field.
 * Displays confidence indicator, the suggested answer, and an "Accept" button.
 * Citation + justification revealed on expand.
 */
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { AiFieldSuggestion } from "@/lib/ai/types";
import { CONFIDENCE_HIGH, CONFIDENCE_MED } from "@/lib/ai/types";

interface AiSuggestionBadgeProps {
  suggestion: AiFieldSuggestion;
  onAccept: (answer: string) => void;
  /** If true the current field value already matches the suggestion */
  alreadyAccepted?: boolean;
}

function confidenceIcon(c: number): string {
  if (c >= CONFIDENCE_HIGH) return "🟢";
  if (c >= CONFIDENCE_MED)  return "🟡";
  return "🔴";
}

function confidenceLabel(c: number): string {
  if (c >= CONFIDENCE_HIGH) return "high";
  if (c >= CONFIDENCE_MED)  return "medium";
  return "low";
}

export function AiSuggestionBadge({
  suggestion,
  onAccept,
  alreadyAccepted,
}: AiSuggestionBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!suggestion.answer) {
    // Empty answer means Claude had insufficient data — show low-key info only
    return (
      <p className="text-xs text-slate-500 italic mt-1">
        🤖 AI: insufficient data to determine — fill manually
      </p>
    );
  }

  const pct = Math.round(suggestion.confidence * 100);
  const icon = confidenceIcon(suggestion.confidence);
  const label = confidenceLabel(suggestion.confidence);

  return (
    <div
      className={cn(
        "mt-2 rounded-lg border px-3 py-2 text-xs space-y-1 transition-colors",
        alreadyAccepted
          ? "border-indigo-700/60 bg-indigo-950/40"
          : "border-slate-700 bg-slate-800/60",
      )}
    >
      {/* Top row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400">🤖 AI suggests:</span>
        <span
          className={cn(
            "font-semibold",
            suggestion.answer === "Yes"
              ? "text-green-400"
              : suggestion.answer === "No"
              ? "text-red-400"
              : "text-slate-400",
          )}
        >
          {suggestion.answer}
        </span>

        <span className="text-slate-500">
          {icon} {pct}% confidence ({label})
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-500 hover:text-slate-300 transition-colors underline"
          >
            {expanded ? "hide" : "why?"}
          </button>

          {!alreadyAccepted && (
            <button
              type="button"
              onClick={() => onAccept(suggestion.answer)}
              className={cn(
                "px-2 py-0.5 rounded font-medium transition-colors",
                "bg-indigo-700/70 hover:bg-indigo-600/80 text-indigo-200",
              )}
            >
              Accept
            </button>
          )}

          {alreadyAccepted && (
            <span className="text-indigo-400 font-medium">✓ Applied</span>
          )}
        </div>
      </div>

      {/* Expanded: citation + justification */}
      {expanded && (
        <div className="pt-1 space-y-1 border-t border-slate-700">
          <p className="text-slate-300">
            <span className="text-slate-500">Justification: </span>
            {suggestion.justification}
          </p>
          {suggestion.citation && (
            <p className="text-slate-400 italic">
              <span className="not-italic text-slate-500">Citation: </span>
              &ldquo;{suggestion.citation}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
