"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RegistryControlsProps {
  assessmentId: string;
  initialListed: boolean;
  initialPdfEnabled: boolean;
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
  help: string;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 py-2",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "mt-0.5 shrink-0 w-9 h-5 rounded-full transition-colors relative",
          checked ? "bg-brand-500" : "bg-slate-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-slate-200">{label}</span>
        <span className="block text-xs text-slate-500 mt-0.5">{help}</span>
      </span>
    </label>
  );
}

export function RegistryControls({
  assessmentId,
  initialListed,
  initialPdfEnabled,
}: RegistryControlsProps) {
  const router = useRouter();
  const [listed, setListed] = useState(initialListed);
  const [pdfEnabled, setPdfEnabled] = useState(initialPdfEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (nextListed: boolean, nextPdfEnabled: boolean) => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/assessments/${assessmentId}/registry`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listedPublicly: nextListed, publicPdfEnabled: nextPdfEnabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setListed(data.listedPublicly);
      setPdfEnabled(data.publicPdfEnabled);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        Public registry
      </h3>
      <p className="text-xs text-slate-600 mb-2">
        Two independent switches — listing a token never makes its report downloadable on its own.
      </p>

      <div className="divide-y divide-slate-800/60">
        <Toggle
          checked={listed}
          disabled={saving}
          onChange={(next) => save(next, next ? pdfEnabled : false)}
          label="List in public registry"
          help="Shows the token name, ticker, flag, and review date in the public search — nothing else."
        />
        <Toggle
          checked={pdfEnabled}
          disabled={saving || !listed}
          onChange={(next) => save(listed, next)}
          label="Allow public PDF download"
          help={
            listed
              ? "Anyone can download the full report — score, findings, and quoted evidence — with no contact form."
              : "Enable listing first."
          }
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
