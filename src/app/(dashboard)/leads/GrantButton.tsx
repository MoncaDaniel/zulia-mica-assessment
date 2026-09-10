"use client";
import React, { useState } from "react";

export function GrantButton({ leadId, status }: { leadId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${leadId}/grant`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create link");
      } else {
        setUrl(data.url);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the input is selectable as a fallback */
    }
  }

  if (url) {
    return (
      <div className="flex items-center gap-2 max-w-md">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 font-mono"
        />
        <button
          onClick={copy}
          className="shrink-0 px-2 py-1 text-xs rounded border border-slate-600 text-slate-300 hover:border-slate-400"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={generate}
        disabled={loading}
        className="px-2.5 py-1 text-xs rounded border border-brand-700 text-brand-300 hover:bg-brand-900/30 disabled:opacity-40"
      >
        {loading ? "…" : status === "CONTACTED" ? "New link" : "Generate run link"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
