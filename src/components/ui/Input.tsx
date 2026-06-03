"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500",
          "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
