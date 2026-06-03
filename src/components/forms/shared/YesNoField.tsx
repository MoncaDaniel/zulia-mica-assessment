"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { AiFieldSuggestion } from "@/lib/ai/types";
import { AiSuggestionBadge } from "./AiSuggestionBadge";

interface YesNoFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  aiSuggestion?: AiFieldSuggestion;
}

export function YesNoField({
  label,
  name,
  value,
  onChange,
  hint,
  required,
  aiSuggestion,
}: YesNoFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex gap-3">
        {(["Yes", "No"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              value === opt
                ? opt === "Yes"
                  ? "bg-green-900/60 border-green-600 text-green-300"
                  : "bg-red-900/60 border-red-600 text-red-300"
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
