import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${Math.round(score)}%`;
}

export function scoreToColor(score: number | null | undefined): string {
  if (score == null) return "text-slate-400";
  if (score > 75) return "text-green-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function flagToColor(flag: string | null | undefined): string {
  switch (flag) {
    case "PASS": return "bg-green-900/40 text-green-300 border-green-700";
    case "REVIEW": return "bg-amber-900/40 text-amber-300 border-amber-700";
    case "FAIL": return "bg-red-900/40 text-red-300 border-red-700";
    case "EXEMPT": return "bg-sky-900/40 text-sky-300 border-sky-700";
    default: return "bg-slate-800 text-slate-400 border-slate-700";
  }
}

export function statusToColor(status: string): string {
  switch (status) {
    case "DRAFT": return "bg-slate-800 text-slate-300 border-slate-600";
    case "SUBMITTED": return "bg-blue-900/40 text-blue-300 border-blue-700";
    case "APPROVED": return "bg-green-900/40 text-green-300 border-green-700";
    case "REJECTED": return "bg-red-900/40 text-red-300 border-red-700";
    default: return "bg-slate-800 text-slate-400 border-slate-700";
  }
}
