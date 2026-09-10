"use client";
import React, { useState } from "react";

/**
 * The "request another free assessment" form. Writes a LeadRequest; an admin
 * follows up with a one-time run link. Deliberately low-friction: email is
 * the only required field.
 */
export function RequestAnotherForm({
  defaultTokenName,
  compact,
}: {
  defaultTokenName?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [tokenName, setTokenName] = useState(defaultTokenName ?? "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tokenName: tokenName.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        setError(
          data.error?.fieldErrors?.email?.[0] ??
            (typeof data.error === "string" ? data.error : "") ??
            "Something went wrong — check your email address and try again.",
        );
      }
    } catch {
      setError("Network error — please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
        <p className="font-medium text-white">Request received.</p>
        <p className="mt-1 text-sm text-slate-400">
          We&apos;ll email <span className="text-slate-200">{email}</span> a one-time link to run
          another assessment. If you&apos;ve already asked recently, the earlier request still stands.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${compact ? "" : "sm:p-6"}`}
    >
      {!compact && (
        <p className="mb-4 text-sm text-slate-400">
          You&apos;ve used your free assessment. Leave your email and we&apos;ll send a one-time link
          for another one.
        </p>
      )}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Token <span className="font-normal normal-case text-slate-600">optional</span>
          </label>
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Which token do you want assessed?"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Note <span className="font-normal normal-case text-slate-600">optional</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Anything we should know?"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : "Request another assessment"}
        </button>
      </div>
    </form>
  );
}
