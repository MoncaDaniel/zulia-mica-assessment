"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FlagBadge } from "@/components/dashboard/StatusBadge";
import { formatDate } from "@/lib/utils";
import { RegistryModal, type RegistryHit } from "@/components/public/RegistryModal";
import { Footer } from "@/components/layout/Footer";

export default function PublicRegistryPage() {
  const [all, setAll] = useState<RegistryHit[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [modalToken, setModalToken] = useState<RegistryHit | null>(null);
  const [showGenericModal, setShowGenericModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-10">
          <h1 className="font-display font-bold text-2xl text-white">
            Zulia <span className="text-brand-500">MiCA</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Public token registry</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white">
            Tokens we've already assessed
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Click a token for a preview of the analysis, or check the list before
            requesting a new one — if it's already here, you get the answer instantly.
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

          {!loadError &&
            filtered &&
            filtered.map((r, i) => (
              <button
                key={`${r.tokenName}-${i}`}
                onClick={() => setModalToken(r)}
                className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-slate-700 hover:bg-slate-800/50 transition-colors"
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
              </button>
            ))}

          {!loadError && all && all.length > 0 && filtered && filtered.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-300">No match for "{search}"</p>
              <p className="text-sm text-slate-500 mt-1">Request it below and we'll take a look.</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="md" onClick={() => setShowGenericModal(true)}>
            Don't see your token? Request an assessment
          </Button>
        </div>

        <p className="text-xs text-slate-600 text-center pt-6">
          Matches on token name or ticker only — always verify the contract address and
          chain independently. Only assessments an analyst has published appear here.
        </p>

        <Footer />
      </div>

      {modalToken && (
        <RegistryModal token={modalToken} onClose={() => setModalToken(null)} />
      )}
      {showGenericModal && (
        <RegistryModal defaultTokenName={search} onClose={() => setShowGenericModal(false)} />
      )}
    </div>
  );
}
