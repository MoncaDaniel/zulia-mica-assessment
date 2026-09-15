"use client";
import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function DashboardChrome({
  hideUserInfo,
  children,
}: {
  hideUserInfo: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar hideUserInfo={hideUserInfo} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 flex flex-col min-w-0">
          <div className="flex-1 min-w-0">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
