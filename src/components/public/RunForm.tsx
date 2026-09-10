"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Mode = "upload" | "url";

/**
 * Public, no-login assessment form. Posts to /api/public/assessments (which
 * enforces the one-free-run gate) and, on success, sends the visitor to the
 * live result page.
 */
export function RunForm({ viaGrant }: { viaGrant?: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tokenName, setTokenName] = useState("");
  const [ticker, setTicker] = useState("");
  const [mode, setMode] = useState<Mode>("upload");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setPdfFile(file);
    else setError("Please upload a PDF file.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenName.trim()) return setError("Token name is required.");
    if (mode === "upload" && !pdfFile) return setError("Please upload the whitepaper PDF.");
    if (mode === "url" && !pdfUrl.trim()) return setError("Please paste a link to the whitepaper PDF.");

    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("tokenName", tokenName.trim());
    if (ticker.trim()) fd.append("ticker", ticker.trim());
    if (mode === "upload") fd.append("pdf", pdfFile!);
    else fd.append("whitepaperUrl", pdfUrl.trim());

    try {
      const res = await fetch("/api/public/assessments", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/a/${data.id}`);
        return;
      }
      if (res.status === 429) {
        // Gate tripped between page load and submit — bounce to /run, which
        // will render the "request another" panel.
        router.replace("/run?used=1");
        return;
      }
      setError(data.error ?? "Couldn't start the assessment. Please try again.");
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {viaGrant && (
        <p className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-3 py-2 text-xs text-emerald-300">
          Your one-time link is active — this run is on us.
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
          Token name
        </label>
        <input
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="e.g. Circle USD Coin"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
          Ticker <span className="font-normal normal-case text-slate-600">optional</span>
        </label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="e.g. USDC"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            Whitepaper PDF
          </label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                mode === "upload" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300",
              )}
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-colors",
                mode === "url" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300",
              )}
            >
              Paste URL
            </button>
          </div>
        </div>

        {mode === "url" ? (
          <div>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://example.com/whitepaper.pdf"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
            <p className="mt-1.5 text-xs text-slate-600">
              Direct link to the PDF file, not a page that links to it. Max 20 MB.
            </p>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragging
                ? "border-brand-500 bg-brand-500/5"
                : pdfFile
                  ? "border-slate-600 bg-slate-800/40"
                  : "border-slate-700 bg-slate-900/40 hover:border-slate-500",
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPdfFile(f);
              }}
            />
            {pdfFile ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">{pdfFile.name}</p>
                <p className="text-xs text-slate-500">{(pdfFile.size / 1_048_576).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfFile(null);
                  }}
                  className="mt-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">
                  Drop the whitepaper PDF here, or <span className="text-brand-400">browse</span>
                </p>
                <p className="text-xs text-slate-600">PDF · max 20 MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !tokenName.trim() || (mode === "upload" ? !pdfFile : !pdfUrl.trim())}
        className={cn(
          "rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
          "bg-brand-600 text-white hover:bg-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Starting…
          </span>
        ) : (
          "Run free assessment"
        )}
      </button>
      <p className="text-xs text-slate-600">
        Takes about 90 seconds. One free assessment per visitor — you can request more by email
        afterwards.
      </p>
    </form>
  );
}
