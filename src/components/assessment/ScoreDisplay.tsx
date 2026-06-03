import React from "react";
import { cn, scoreToColor, formatScore } from "@/lib/utils";
import { SECTION_DEFINITIONS, SECTION_WEIGHTS } from "@/lib/scoring";

interface ScoreDisplayProps {
  overallScore: number | null;
  flag: string | null;
  sectionScores: Partial<Record<string, number | null>>;
}

export function ScoreDisplay({ overallScore, flag, sectionScores }: ScoreDisplayProps) {
  const flagColors: Record<string, string> = {
    PASS: "text-green-400 border-green-600 bg-green-900/20",
    REVIEW: "text-amber-400 border-amber-600 bg-amber-900/20",
    FAIL: "text-red-400 border-red-600 bg-red-900/20",
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        "p-4 rounded-xl border text-center",
        flag ? flagColors[flag] : "border-slate-700 bg-slate-800/50"
      )}>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Overall Score</p>
        <p className={cn("text-4xl font-bold font-display", scoreToColor(overallScore))}>
          {formatScore(overallScore)}
        </p>
        {flag && (
          <p className={cn("text-sm font-semibold mt-1", flagColors[flag]?.split(" ")[0])}>
            {flag}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {SECTION_DEFINITIONS.filter((s) => SECTION_WEIGHTS[s.key]).map((section) => {
          const score = sectionScores[section.key];
          const weight = SECTION_WEIGHTS[section.key]!;

          return (
            <div key={section.key} className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 w-4 text-right">{Math.round(weight * 100)}%</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-400 truncate">{section.label}</span>
                  <span className={cn("font-medium ml-2", scoreToColor(score))}>
                    {formatScore(score)}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
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
  );
}
