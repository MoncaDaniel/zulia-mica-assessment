"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FlagBadge } from "@/components/dashboard/StatusBadge";
import { formatDate } from "@/lib/utils";

interface RegistryHit {
  tokenName: string;
  ticker: string | null;
  flag: string | null;
  checkedAt: string;
}

export default function PublicRegistryPage() {
  const [all, setAll] = useState<RegistryHit[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/public/registry/check")
      .then((res) => res.json())
      .then((data) => setAll(data.results ?? []))
      .catch(() => setLoadError("Couldn't load the registry. Try refreshing."));
  }, []);

  const filtered = useMemo(() => {
    if (!all) return null;
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (r) =>
        r.tokenName.toLowerCase().includes(q) ||
        (r.ticker ?? "").toLowerCase().includes(q)
    );
  }, [all, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const res = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, tokenName: search.trim() || undefined }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error?.fieldErrors?.email?.[0] ?? data.error?.fieldErrors?.phone?.[0] ?? "Couldn't submit — check your email and phone number.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">
              Zulia <span className="text-brand-500">MiCA</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Public token registry</p>
          </div>
          <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Analyst sign in →
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white">
            Tokens we've already assessed
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Check the list below before requesting a new MiCA compliance assessment —
            if it's already here, you get the answer instantly and we skip a redundant
            review.
          </p>
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by token name or ticker…"
          className="text-base py-3"
        />

        <div className="mt-6 space-y-3">
          {loadError && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {loadError}
            </p>
          )}

          {!loadError && all === null && (
            <p className="text-sm text-slate-500 text-center py-6">Loading registry…</p>
          )}

          {!loadError && all !== null && all.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-300">No tokens published yet</p>
              <p className="text-sm text-slate-500 mt-1">Check back soon, or request one below.</p>
            </div>
          )}

          {!loadError && filtered && filtered.length > 0 && (
            <>
              {filtered.map((r, i) => (
                <div
                  key={`${r.tokenName}-${i}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-white">
                      {r.tokenName}
                      {r.ticker && <span className="ml-2 text-xs text-slate-500">{r.ticker}</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Last reviewed {formatDate(r.checkedAt)}
                    </p>
                  </div>
                  <FlagBadge flag={r.flag} />
                </div>
              ))}
              <p className="text-xs text-slate-600 text-center pt-2">
                Status only — contact us below for the full report on a listed token.
              </p>
            </>
          )}

          {!loadError && all && all.length > 0 && filtered && filtered.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-300">No match for "{search}"</p>
              <p className="text-sm text-slate-500 mt-1">Request it below and we'll take a look.</p>
            </div>
          )}
        </div>

        {/* Contact / request form — replaces the old mailto CTA so we get a
            phone number too, not just an email client opening on the visitor's
            device. */}
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-6">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-white font-medium">Thanks — we'll be in touch.</p>
              <p className="text-slate-400 text-sm mt-1">
                We've got your details and will reach out shortly.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-white font-medium">
                Don't see your token, or want the full report?
              </h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">
                Leave your email and phone number and we'll contact you directly.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="tel"
                    placeholder="+34 600 000 000"
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                {submitError && <p className="text-sm text-red-400">{submitError}</p>}
                <Button type="submit" variant="primary" size="md" loading={submitting} className="w-full sm:w-auto">
                  Request contact
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-xs text-slate-600 text-center pt-6">
          Matches on token name or ticker only — always verify the contract address and
          chain independently. Only assessments an analyst has published appear here.
        </p>
      </div>
    </div>
  );
}
