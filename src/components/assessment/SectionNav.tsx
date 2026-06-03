"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { SECTION_DEFINITIONS } from "@/lib/scoring";

interface SectionNavProps {
  currentStep: number;
  completedSections: Set<string>;
  onNavigate: (step: number) => void;
}

export function SectionNav({ currentStep, completedSections, onNavigate }: SectionNavProps) {
  return (
    <nav className="space-y-1">
      {SECTION_DEFINITIONS.map((section, idx) => {
        const isComplete = completedSections.has(section.key);
        const isCurrent = idx === currentStep;

        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onNavigate(idx)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
              isCurrent
                ? "bg-brand-500/20 text-brand-300 font-medium"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full border text-xs font-mono flex items-center justify-center",
                isComplete
                  ? "bg-green-600 border-green-500 text-white"
                  : isCurrent
                  ? "border-brand-500 text-brand-400"
                  : "border-slate-600 text-slate-500"
              )}
            >
              {isComplete ? "✓" : idx + 1}
            </span>
            <span className="truncate">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
