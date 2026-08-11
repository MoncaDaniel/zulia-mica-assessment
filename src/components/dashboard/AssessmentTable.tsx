"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, FlagBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate, formatScore, scoreToColor, cn } from "@/lib/utils";

interface Assessment {
  id: string;
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  listedPublicly: boolean;
  createdAt: string;
  createdBy: { name: string };
  sections: Array<{ sectionKey: string; completedAt: string | null }>;
}

interface AssessmentTableProps {
  assessments: Assessment[];
  userRole: string;
  onDelete?: (id: string) => void;
}

const STATUS_FILTERS = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;

export function AssessmentTable({ assessments, userRole, onDelete }: AssessmentTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingRegistry, setTogglingRegistry] = useState<string | null>(null);
  const [listedOverrides, setListedOverrides] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");

  const canManageRegistry = userRole === "REVIEWER" || userRole === "ADMIN";

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/assessments/${id}`, { method: "DELETE" });
    onDelete?.(id);
    setDeleting(null);
  };

  const handleToggleRegistry = async (id: string, next: boolean) => {
    setTogglingRegistry(id);
    const res = await fetch(`/api/assessments/${id}/registry`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listedPublicly: next }),
    });
    if (res.ok) {
      setListedOverrides((prev) => ({ ...prev, [id]: next }));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't update the public registry.");
    }
    setTogglingRegistry(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assessments.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.tokenName.toLowerCase().includes(q) ||
        (a.ticker ?? "").toLowerCase().includes(q)
      );
    });
  }, [assessments, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token name or ticker…"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                statusFilter === s
                  ? "bg-brand-500/20 text-brand-400 border-brand-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">No assessments yet</p>
          <p className="text-sm mt-1">Create your first MiCA token assessment to get started</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">No assessments match your search</p>
          <p className="text-sm mt-1">Try a different token name, ticker, or status filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Token</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Flag</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Registry</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Analyst</th>
                <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((a) => {
                const completedCount = a.sections.filter((s) => s.completedAt).length;
                const progressPct = Math.round((completedCount / 10) * 100);
                const listedPublicly = listedOverrides[a.id] ?? a.listedPublicly;

                return (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pr-4">
                      <Link href={`/assessments/${a.id}`} className="hover:text-brand-400 transition-colors">
                        <span className="font-medium text-white">{a.tokenName}</span>
                        {a.ticker && (
                          <span className="ml-2 text-xs text-slate-500">{a.ticker}</span>
                        )}
                      </Link>
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn("font-semibold font-display", scoreToColor(a.overallScore))}>
                        {formatScore(a.overallScore)}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <FlagBadge flag={a.flag} />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{completedCount}/10</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      {a.status !== "APPROVED" ? (
                        <span className="text-slate-600 text-xs">—</span>
                      ) : canManageRegistry ? (
                        <button
                          onClick={() => handleToggleRegistry(a.id, !listedPublicly)}
                          disabled={togglingRegistry === a.id}
                          title={
                            listedPublicly
                              ? "Visible in the public registry — click to unlist"
                              : "Not public — click to list token/flag/date in the public registry"
                          }
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50",
                            listedPublicly
                              ? "bg-brand-500/20 text-brand-400 border-brand-500/40"
                              : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
                          )}
                        >
                          {listedPublicly ? "🔓 Public" : "🔒 Private"}
                        </button>
                      ) : listedPublicly ? (
                        <span className="text-xs text-brand-400">🔓 Public</span>
                      ) : (
                        <span className="text-xs text-slate-600">🔒 Private</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-slate-400">{a.createdBy.name}</td>
                    <td className="py-4 pr-4 text-slate-400">{formatDate(a.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/assessments/${a.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        {(a.status === "APPROVED" || a.status === "SUBMITTED") && (
                          <a href={`/api/assessments/${a.id}/export`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">PDF</Button>
                          </a>
                        )}
                        {userRole === "ADMIN" && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={deleting === a.id}
                            onClick={() => handleDelete(a.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
