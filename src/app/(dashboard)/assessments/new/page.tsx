"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type WhitepaperMode = "upload" | "url";

export default function NewAssessmentPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tokenName,  setTokenName]  = useState("");
  const [ticker,     setTicker]     = useState("");
  const [mode,       setMode]       = useState<WhitepaperMode>("upload");
  const [pdfFile,    setPdfFile]    = useState<File | null>(null);
  const [pdfUrl,     setPdfUrl]     = useState("");
  const [dragging,   setDragging]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setPdfFile(file);
    else setError("Please upload a PDF file.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenName.trim()) { setError("Token name is required."); return; }
    if (mode === "upload" && !pdfFile)      { setError("Please upload the whitepaper PDF."); return; }
    if (mode === "url"    && !pdfUrl.trim()) { setError("Please paste a link to the whitepaper PDF."); return; }

    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("tokenName", tokenName.trim());
    if (ticker.trim()) fd.append("ticker", ticker.trim());
    if (mode === "upload") {
      fd.append("pdf", pdfFile!);
    } else {
      fd.append("whitepaperUrl", pdfUrl.trim());
    }

    const res = await fetch("/api/assessments", { method: "POST", body: fd });

    if (res.ok) {
      const assessment = await res.json();
      router.push(`/assessments/${assessment.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Failed to create assessment. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-white">New Assessment</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a whitepaper PDF, or paste a link to one — Claude will assess it against all MiCA disclosure requirements.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Token name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Token Name
          </label>
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="e.g. Circle USD Coin"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
        </div>

        {/* Ticker */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Ticker <span className="text-slate-600 normal-case font-normal">optional</span>
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="e.g. USDC"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
        </div>

        {/* PDF upload / URL */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Whitepaper PDF
            </label>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  mode === "upload" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300",
                )}
              >
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              />
              <p className="mt-1.5 text-xs text-slate-600">
                Must be a direct link to the PDF file, not a page that links to it. We fetch it once when you submit and save a copy — max 20 MB.
              </p>
            </div>
          ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors",
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
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-200">{pdfFile.name}</p>
                </div>
                <p className="text-xs text-slate-500">{(pdfFile.size / 1_048_576).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="w-8 h-8 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
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
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !tokenName.trim() || (mode === "upload" ? !pdfFile : !pdfUrl.trim())}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-brand-600 hover:bg-brand-500 text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : "Run Assessment"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
