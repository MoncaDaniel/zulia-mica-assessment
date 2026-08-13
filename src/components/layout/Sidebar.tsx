"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/assessments/new", label: "New Assessment", icon: "+" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems =
    session?.user.role === "ADMIN"
      ? [...NAV_ITEMS, { href: "/leads", label: "Leads", icon: "☎" }]
      : NAV_ITEMS;

  return (
    <aside className="w-60 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-slate-800">
        <span className="font-display font-bold text-lg text-white">MiCA</span>
        <span className="text-brand-500 font-bold text-lg"> ESMA</span>
        <p className="text-xs text-slate-500 mt-0.5">Assessment Tool</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-brand-500/20 text-brand-400 font-medium"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <Link
          href="/check"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <span className="text-base">🔎</span>
          Public registry ↗
        </Link>
      </div>

      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-600">
        MiCA Regulation — EU 2023/1114
      </div>
    </aside>
  );
}
