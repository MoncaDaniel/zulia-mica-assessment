"use client";
import React, { useState } from "react";
import Link from "next/link";
import { StatusBadge, FlagBadge } from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatScore, scoreToColor, cn } from "@/lib/utils";

interface Assessment {
  id: string;
  tokenName: string;
  ticker: string | null;
  status: string;
  overallScore: number | null;
  flag: string | null;
  createdAt: string;
  createdBy: { name: string };
  sections: Array<{ sectionKey: string; completedAt: string | null }>;
}

interface AssessmentTableProps {
  assessments: Assessment[];
  userRole: string;
  onDelete?: (id: string) => void;
}

export function AssessmentTable({ assessments, userRole, onDelete }: AssessmentTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/assessments/${id}`, { method: "DELETE" });
    onDelete?.(id);
    setDeleting(null);
  };

  if (assessments.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">No assessments yet</p>
        <p className="text-sm mt-1">Create your first MiCA token assessment to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left">
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Token</th>
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Flag</th>
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</th>
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Analyst</th>
            <th className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
            <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {assessments.map((a) => {
            const completedCount = a.sections.filter((s) => s.completedAt).length;
            const progressPct = Math.round((completedCount / 10) * 100);

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
  );
}
