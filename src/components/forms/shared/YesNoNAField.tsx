"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { AiFieldSuggestion } from "@/lib/ai/types";
import { AiSuggestionBadge } from "./AiSuggestionBadge";

interface YesNoNAFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  aiSuggestion?: AiFieldSuggestion;
}

export function YesNoNAField({
  label,
  name,
  value,
  onChange,
  hint,
  aiSuggestion,
}: YesNoNAFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex gap-3">
        {(["Yes", "No", "N/A"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              value === opt
                ? opt === "Yes"
                  ? "bg-green-900/60 border-green-600 text-green-300"
                  : opt === "No"
                  ? "bg-red-900/60 border-red-600 text-red-300"
                  : "bg-slate-700 border-slate-500 text-slate-300"
                : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300",
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {aiSuggestion && (
        <AiSuggestionBadge
          suggestion={aiSuggestion}
          onAccept={onChange}
          alreadyAccepted={
            !!aiSuggestion.answer && value === aiSuggestion.answer
          }
        />
      )}
    </div>
  );
}
