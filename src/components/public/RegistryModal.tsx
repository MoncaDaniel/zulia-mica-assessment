"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { FlagBadge } from "@/components/dashboard/StatusBadge";
import { formatDate } from "@/lib/utils";

export interface RegistryHit {
  id: string;
  tokenName: string;
  ticker: string | null;
  flag: string | null;
  checkedAt: string;
  chain: string | null;
  classification: string | null;
  teaser: string | null;
  canDownload: boolean;
}

// Two modes: a listed token (shows the preview panel above the form) or a
// generic request (contact-only, e.g. from the "no match" empty state) —
// distinguished by whether `token` is set.
interface RegistryModalProps {
  token?: RegistryHit;
  defaultTokenName?: string;
  onClose: () => void;
}

export function RegistryModal({ token, defaultTokenName, onClose }: RegistryModalProps) {
  const [tokenName, setTokenName] = useState(token?.tokenName ?? defaultTokenName ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // A downloadable token opens straight to the download action; the
  // contact form is tucked behind an extra click rather than shown by
  // default. Anything else (not yet PDF-enabled, or no token match at all)
  // shows the contact form immediately, same as before.
  const [showContactForm, setShowContactForm] = useState(!token?.canDownload);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, tokenName: tokenName.trim() || undefined }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error?.fieldErrors?.email?.[0] ??
          data.error?.fieldErrors?.phone?.[0] ??
          "Couldn't submit — check your email and phone number."
      );
    }
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-full overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {token ? token.tokenName : "Request an assessment"}
            {token?.ticker && <span className="ml-2 text-sm text-slate-500">{token.ticker}</span>}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {token && (
          <div className="space-y-3 mb-5 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <FlagBadge flag={token.flag} />
              {token.classification && <Badge variant="info">{token.classification}</Badge>}
              {token.chain && <Badge>{token.chain}</Badge>}
            </div>
            {token.teaser && <p className="text-sm text-slate-400">{token.teaser}</p>}
            <p className="text-xs text-slate-600">Last reviewed {formatDate(token.checkedAt)}</p>
          </div>
        )}

        {submitted ? (
          <div className="text-center py-4">
            <p className="text-white font-medium">Thanks — we'll be in touch.</p>
            <p className="text-slate-400 text-sm mt-1">
              We've got your details and will reach out shortly with the full report.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : token?.canDownload && !showContactForm ? (
          <div className="space-y-3">
            <a
              href={`/api/public/assessments/${token.id}/pdf`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-3 sm:py-2.5 transition-colors"
            >
              ↓ Download full PDF
            </a>
            <button
              type="button"
              onClick={() => setShowContactForm(true)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              Want to discuss this token, or request a different one? Get in touch
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-4">
              {token
                ? "Enter your email and phone and we'll send over the full report."
                : "Enter your email and phone and we'll get back to you about it."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              {!token && (
                <Input
                  label="Token (optional)"
                  placeholder="e.g. Tether, USDT..."
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
              )}
              <Input
                type="email"
                label="Email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Input
                type="tel"
                label="Phone"
                placeholder="+34 600 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" variant="primary" size="md" loading={submitting} className="w-full">
                Send
              </Button>
              {token?.canDownload && (
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
                >
                  ← Back to download
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
