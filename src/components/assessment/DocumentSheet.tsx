"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MICA_GROUPS } from "@/lib/ai/mica-groups";
import { overallScore as calcWeightedScore, noIssuerDetected as deriveNoIssuer } from "@/lib/ai/scoring";
import type { MicaGroupData, MicaItemFinding } from "@/lib/ai/types";
import type { CoinFinancials } from "@/lib/ai/coin-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type GroupStatus = "pending" | "active" | "complete";

interface StreamEvent {
  type: "fetching_market_data" | "financial_data" | "group_complete" | "narrative_complete" | "done" | "error";
  groupKey?: string;
  data?: MicaGroupData | CoinFinancials | null;
  narrative?: string;
  tokensUsed?: number;
  message?: string;
}

interface DocumentSheetProps {
  assessmentId:     string;
  tokenName:        string;
  pdfName:          string | null;
  aiStatus:         string;
  initialGroups:    Partial<Record<string, MicaGroupData>>;
  initialNarrative: string | null;
  readOnly?:        boolean;
}

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: MicaItemFinding["status"] | "pending" | "analysing" }) {
  if (status === "analysing") {
    return (
      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
        <span className="w-3 h-3 rounded-full border-2 border-amber-400 animate-pulse" />
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="flex-shrink-0 w-4 mt-0.5 text-stone-300 font-mono text-[11px] leading-4 select-none tabular-nums">
        [ ]
      </span>
    );
  }
  if (status === "found") {
    return (
      <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-emerald-100 flex items-center justify-center">
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5l2.5 2.5 4.5-5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === "not_found") {
    return (
      <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-red-50 flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 1l6 6M7 1L1 7" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
    );
  }
  if (status === "na") {
    return (
      <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-stone-100 flex items-center justify-center">
        <span className="text-stone-400 text-xs font-bold leading-none">–</span>
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-sm bg-amber-50 flex items-center justify-center">
      <span className="text-amber-500 text-xs font-bold leading-none">?</span>
    </span>
  );
}

// ── Item row — animates in when finding arrives ───────────────────────────────

function ItemRow({
  label,
  articleRef,
  finding,
  isActive,
  revealDelay,
}: {
  label:        string;
  articleRef:   string;
  finding:      MicaItemFinding | null;
  isActive:     boolean;
  revealDelay:  number; // ms
}) {
  const status = isActive ? "analysing" : finding?.status ?? "pending";
  const revealed = !!finding;

  return (
    <div
      className={cn(
        "flex gap-3 py-2.5 border-b border-stone-100 last:border-0",
        revealed ? "item-reveal" : isActive ? "opacity-100" : "opacity-35",
      )}
      style={revealed ? { animationDelay: `${revealDelay}ms` } : undefined}
    >
      <StatusIcon status={status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <p className={cn(
            "text-sm leading-snug",
            status === "found"       ? "text-stone-800"
            : status === "not_found" ? "text-stone-600"
            : status === "na"        ? "text-stone-400"
            : status === "analysing" ? "text-stone-700 font-medium"
            : "text-stone-400",
          )}>
            {label}
          </p>
          <span className="flex-shrink-0 text-[10px] text-stone-400 font-mono mt-0.5 whitespace-nowrap">
            {articleRef}
          </span>
        </div>

        {finding?.status === "found" && finding.excerpt && (
          <p className="mt-1.5 text-xs text-stone-500 italic leading-relaxed">
            &ldquo;{finding.excerpt}&rdquo;
          </p>
        )}
        {finding?.status === "not_found" && (
          <p className="mt-1 text-xs text-red-400">Not found in whitepaper</p>
        )}
        {finding?.status === "na" && (
          <p className="mt-1 text-xs text-stone-400">Not applicable</p>
        )}
        {finding?.status === "" && (
          <p className="mt-1 text-xs text-amber-600">Insufficient data</p>
        )}
        {isActive && (
          <p className="mt-1 text-xs text-amber-500 animate-pulse">Analysing…</p>
        )}
        {finding?.reasoning && (
          <p className={cn(
            "mt-1 text-[11px] leading-relaxed",
            finding.confidence !== undefined && finding.confidence < 0.5
              ? "text-amber-600"
              : "text-stone-400",
          )}>
            {finding.confidence !== undefined && finding.confidence < 0.5 && (
              <span className="font-medium">Low confidence · </span>
            )}
            {finding.reasoning}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────────────

function GroupSection({
  group,
  data,
  status,
  revealedAt,
}: {
  group:     typeof MICA_GROUPS[0];
  data:      MicaGroupData | null;
  status:    GroupStatus;
  revealedAt: number | null; // timestamp when data first arrived
}) {
  const foundCount = data
    ? Object.values(data).filter((f) => f.status === "found").length
    : 0;
  const totalCount = group.items.length;

  return (
    <div className="mt-8 first:mt-0">
      <div className="mb-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className={cn(
            "text-[11px] font-bold uppercase tracking-widest",
            status === "complete" ? "text-stone-600"
            : status === "active"  ? "text-stone-800"
            : "text-stone-300",
          )}>
            {group.label}
          </h3>
          {status === "complete" && (
            <span className="text-xs text-stone-400 flex-shrink-0 tabular-nums">
              {foundCount}/{totalCount} found
            </span>
          )}
          {status === "active" && (
            <span className="text-xs text-amber-500 flex-shrink-0 animate-pulse">
              Analysing
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-stone-400 mt-0.5">
          {group.articleRef} · {group.scope}
        </p>
        <div className="mt-2 h-px bg-stone-200" />
      </div>

      {/* If all completed items are N/A, show a single "not applicable" notice */}
      {data && Object.values(data).every((f) => f.status === "na" || f.status === "") ? (
        <p className="text-xs text-stone-400 italic py-2">
          All items not applicable for this token type.
        </p>
      ) : (
        <div>
          {group.items.map((item, idx) => {
            const finding   = data?.[item.key] ?? null;
            const isActive  = status === "active" && idx === 0 && !data;
            const revealDelay = revealedAt !== null ? idx * 70 : 0;

            return (
              <ItemRow
                key={item.key}
                label={item.label}
                articleRef={item.articleRef}
                finding={finding}
                isActive={isActive}
                revealDelay={revealDelay}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Financial data card ───────────────────────────────────────────────────────

function FinancialCard({ f }: { f: CoinFinancials }) {
  const fmtM = (n: number | null) =>
    n === null ? "—" : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(0)}M`;
  const fmtN = (n: number | null) =>
    n === null ? "—" : n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n.toLocaleString();

  return (
    <div className="mt-4 mb-6 p-4 bg-stone-50 border border-stone-200 rounded-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-1">
            Market Data · CoinGecko
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-stone-900">{f.name}</span>
            <span className="text-xs text-stone-500 font-mono">{f.symbol}</span>
            {f.market_cap_rank && (
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                #{f.market_cap_rank}
              </span>
            )}
            {f.is_significant_token && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                Significant Token · Art. 43
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-stone-900">
            {f.price_usd !== null ? `$${f.price_usd < 0.01 ? f.price_usd.toFixed(6) : f.price_usd.toFixed(4)}` : "—"}
          </p>
          {f.price_change_30d_pct !== null && (
            <p className={cn(
              "text-xs",
              f.price_change_30d_pct >= 0 ? "text-emerald-600" : "text-red-500",
            )}>
              {f.price_change_30d_pct >= 0 ? "+" : ""}{f.price_change_30d_pct.toFixed(1)}% (30d)
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Market Cap",    value: fmtM(f.market_cap_usd) },
          { label: "24h Volume",    value: fmtM(f.volume_24h_usd) },
          { label: "Circ. Supply",  value: fmtN(f.circulating_supply) },
          { label: "Max Supply",    value: f.max_supply ? fmtN(f.max_supply) : "Unlimited" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">{label}</p>
            <p className="text-xs font-semibold text-stone-700 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {f.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {f.categories.map((c) => (
            <span key={c} className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
              {c}
            </span>
          ))}
          {f.exchanges_listed !== null && (
            <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full">
              {f.exchanges_listed} exchanges
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, isRunning, exempt }: { score: number | null; isRunning: boolean; exempt: boolean }) {
  const pct   = score ?? 0;
  const color = exempt ? "#0284c7" : pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  const label = exempt ? "EXEMPT" : pct >= 75 ? "PASS" : pct >= 50 ? "REVIEW" : "FAIL";

  // SVG circle gauge — r=28, circumference = 2πr ≈ 175.9
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          {/* Background track */}
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e7e5e4" strokeWidth="6" />
          {/* Score arc */}
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke={score !== null || exempt ? color : "#e7e5e4"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={exempt ? `${circ} ${circ}` : `${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isRunning && score === null ? (
            <span className="text-[10px] text-stone-400 animate-pulse">—</span>
          ) : exempt ? (
            <span className="text-[10px] font-bold leading-none" style={{ color }}>N/A</span>
          ) : (
            <span className="text-xl font-bold leading-none" style={{ color: score !== null ? color : "#a8a29e" }}>
              {score ?? "—"}
            </span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">
          Disclosure
        </p>
        {(score !== null || exempt) && (
          <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color }}>
            {label}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main DocumentSheet ────────────────────────────────────────────────────────

export function DocumentSheet({
  assessmentId,
  tokenName,
  pdfName,
  aiStatus:         initialAiStatus,
  initialGroups,
  initialNarrative,
  readOnly,
}: DocumentSheetProps) {
  const [groups,      setGroups]      = useState<Partial<Record<string, MicaGroupData>>>(initialGroups);
  const [revealTimes, setRevealTimes] = useState<Partial<Record<string, number>>>({});
  const [narrative,   setNarrative]   = useState<string | null>(initialNarrative);
  const [financials,  setFinancials]  = useState<CoinFinancials | null>(null);
  const [fetchingMkt, setFetchingMkt] = useState(false);
  const [aiStatus,    setAiStatus]    = useState(initialAiStatus);
  const [error,       setError]       = useState<string | null>(null);
  const [tokens,      setTokens]      = useState<number | null>(null);

  const completedGroups = Object.keys(groups).length;
  const totalGroups     = MICA_GROUPS.length;
  const compliancePct   = calcWeightedScore(groups);

  // Derived, not stored separately: true exactly when the no-issuer cascade
  // in the extraction prompt fired (see prompts.ts) — i.e. Claude determined
  // no identifiable legal entity created or controls this asset, so every
  // group came back "na" and overallScore is null. Surfaced as a finding
  // (and as the EXEMPT flag, stored on Assessment.flag) rather than letting
  // the score just quietly go blank with no explanation.
  const noIssuerFound = deriveNoIssuer(groups);

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case "fetching_market_data":
        setFetchingMkt(true);
        break;
      case "financial_data":
        setFetchingMkt(false);
        if (event.data) setFinancials(event.data as CoinFinancials);
        break;
      case "group_complete": {
        const key  = event.groupKey!;
        const data = event.data as MicaGroupData;
        setGroups((prev) => ({ ...prev, [key]: data }));
        setRevealTimes((prev) => ({ ...prev, [key]: Date.now() }));
        setAiStatus("PENDING");
        break;
      }
      case "narrative_complete":
        setNarrative(event.narrative ?? null);
        break;
      case "done":
        setTokens(event.tokensUsed ?? null);
        setAiStatus("COMPLETED");
        break;
      case "error":
        setError(event.message ?? "Analysis failed");
        setAiStatus("FAILED");
        break;
    }
  }, []);

  useEffect(() => {
    if (readOnly) return;
    if (initialAiStatus === "COMPLETED" || initialAiStatus === "FAILED") return;

    const controller = new AbortController();

    async function startStream() {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}/analyze`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    "{}",
          signal:  controller.signal,
        });

        if (!res.ok || !res.body) {
          setError(`Analysis failed: HTTP ${res.status}`);
          setAiStatus("FAILED");
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                handleStreamEvent(JSON.parse(line.slice(6)) as StreamEvent);
              } catch { /* skip malformed */ }
            }
          }
        } finally {
          reader.cancel().catch(() => {});
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Stream error");
          setAiStatus("FAILED");
        }
      }
    }

    startStream();
    return () => { controller.abort(); };
  }, [assessmentId, initialAiStatus, readOnly, handleStreamEvent]);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const isRunning = aiStatus === "NONE" || aiStatus === "PENDING";

  return (
    <div className="py-8 px-4">
      <div
        className="max-w-[860px] mx-auto bg-white rounded-sm"
        style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)" }}
      >
        {/* Progress rail */}
        {isRunning && (
          <div className="h-0.5 bg-stone-100 rounded-t-sm overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-700 ease-out"
              style={{ width: `${(completedGroups / totalGroups) * 100}%` }}
            />
          </div>
        )}

        <div className="px-14 py-12">
          {/* Document header */}
          <div className="border-b-2 border-stone-900 pb-6 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-stone-400 mb-4">
              Regulation (EU) 2023/1114 · MiCA Compliance Assessment
            </p>

            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-stone-900 font-display leading-tight">
                  {tokenName}
                </h1>
                <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-stone-500">
                  {pdfName && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25" />
                      </svg>
                      {pdfName}
                    </span>
                  )}
                  <span>{today}</span>
                  {isRunning && (
                    <span className="text-amber-500 animate-pulse">
                      {fetchingMkt ? "Fetching market data…" : `Analysing · ${completedGroups} of ${totalGroups} groups`}
                    </span>
                  )}
                  {aiStatus === "FAILED" && (
                    <span className="text-red-500">Analysis failed</span>
                  )}
                </div>
              </div>

              {/* Score gauge */}
              <ScoreGauge score={compliancePct} isRunning={isRunning} exempt={noIssuerFound} />
            </div>
          </div>

          {/* Financial card — appears as soon as CoinGecko responds */}
          {financials && <FinancialCard f={financials} />}
          {fetchingMkt && !financials && (
            <div className="mt-4 mb-6 h-20 bg-stone-50 border border-stone-100 rounded-sm animate-pulse" />
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* No-identifiable-issuer notice — explains why Groups 1/2/4 are excluded */}
          {noIssuerFound && (
            <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                No identifiable issuer detected
              </p>
              <p className="mt-1.5 text-xs text-sky-800 leading-relaxed">
                No specific legal entity, company, or foundation could be identified as having
                created, offered, or controlling the issuance of this crypto-asset — e.g. tokens
                distributed automatically as mining or validation rewards, with no pre-mine or
                controlling treasury. Under MiCA Article 4(3) / Recital 22, the Title II
                whitepaper-issuer-disclosure obligations do not attach in this case, so Groups 1
                (Offeror), 2 (Issuer), and 4 (Offer Terms) are excluded from this score rather
                than scored as non-compliant. This reflects the absence of an obligation, not a
                compliance failure.
              </p>
            </div>
          )}

          {/* 13 compliance groups */}
          <div>
            {MICA_GROUPS.map((group, idx) => {
              const data       = groups[group.key] ?? null;
              const prevDone   = idx === 0 || !!groups[MICA_GROUPS[idx - 1].key];
              const status: GroupStatus = data
                ? "complete"
                : isRunning && prevDone ? "active"
                : "pending";
              const revealedAt = revealTimes[group.key] ?? null;

              return (
                <GroupSection
                  key={group.key}
                  group={group}
                  data={data}
                  status={status}
                  revealedAt={revealedAt}
                />
              );
            })}
          </div>

          {/* Narrative */}
          {narrative && (
            <div className="mt-10 pt-8 border-t border-stone-200">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-3">
                Compliance Summary
              </p>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {narrative}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-14 pt-6 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-300 font-mono">
            <span>MiCA ESMA Assessment Tool</span>
            {tokens && <span>{tokens.toLocaleString()} tokens used</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
