"use client";
import React, { useEffect, useState } from "react";
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

const MIN_QUERY_LENGTH = 2;

function requestAssessmentMailto(tokenName: string) {
  const subject = "MiCA Assessment Request";
  const body = tokenName.trim()
    ? `Hi Daniel,\n\nI checked the public registry and didn't find a completed assessment for "${tokenName.trim()}". I'd like to request one.\n\n`
    : `Hi Daniel,\n\nI'd like to request a MiCA token assessment.\n\n`;
  return (
    "mailto:danielmoncada10@gmail.com" +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body)
  );
}

export default function PublicRegistryCheckPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistryHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedFor, setSearchedFor] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError("");
      setSearchedFor(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/registry/check?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          setResults(null);
        } else {
          setError("");
          setResults(data.results);
        }
      } catch {
        setError("Couldn't reach the registry. Try again.");
        setResults(null);
      } finally {
        setSearchedFor(q);
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const showEmptyState = searchedFor !== null && !loading && !error && results?.length === 0;

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
            Has this token already been assessed?
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Search by token name or ticker before requesting a new MiCA compliance
            assessment — if it's already in the registry, you get the answer instantly
            and we skip a redundant review.
          </p>
        </div>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Tether, USDT, MiCA Coin..."
          className="text-base py-3"
          autoFocus
        />

        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-sm text-slate-500 text-center py-6">Searching…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && !error && results && results.length > 0 && (
            <>
              {results.map((r, i) => (
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
                Status only — contact us for the full report on a listed token.
              </p>
            </>
          )}

          {showEmptyState && (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-300">No public record for "{searchedFor}"</p>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                It may not have been assessed yet, or the analysis hasn't been published to the
                registry.
              </p>
              <a href={requestAssessmentMailto(searchedFor ?? "")} target="_blank" rel="noreferrer">
                <Button variant="primary" size="md">Request an assessment</Button>
              </a>
            </div>
          )}

          {searchedFor === null && !loading && (
            <p className="text-xs text-slate-600 text-center pt-4">
              Matches on token name or ticker only — always verify the contract address and chain
              independently. Only assessments an analyst has published appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
