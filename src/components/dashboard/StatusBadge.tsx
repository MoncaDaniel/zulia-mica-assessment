import React from "react";
import { cn, statusToColor, flagToColor } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusToColor(status))}>
      {status}
    </span>
  );
}

export function FlagBadge({ flag }: { flag: string | null }) {
  if (!flag) return <span className="text-slate-500 text-xs">—</span>;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border", flagToColor(flag))}>
      {flag}
    </span>
  );
}
