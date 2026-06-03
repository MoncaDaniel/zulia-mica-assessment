import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-green-900/40 text-green-300 border-green-700",
    warning: "bg-amber-900/40 text-amber-300 border-amber-700",
    danger: "bg-red-900/40 text-red-300 border-red-700",
    info: "bg-blue-900/40 text-blue-300 border-blue-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
