"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function Navbar({
  hideUserInfo = false,
  onMenuClick,
}: {
  hideUserInfo?: boolean;
  onMenuClick?: () => void;
}) {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="md:hidden text-slate-400 hover:text-slate-200 text-xl leading-none px-1 -ml-1"
      >
        ☰
      </button>
      <div className="flex items-center gap-2 sm:gap-4">
        {!hideUserInfo && session?.user && (
          <>
            <span className="hidden sm:inline text-sm text-slate-400">
              {session.user.name}
              <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                {session.user.role}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
