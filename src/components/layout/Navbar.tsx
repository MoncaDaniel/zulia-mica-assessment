"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function Navbar({ hideUserInfo = false }: { hideUserInfo?: boolean }) {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div />
      <div className="flex items-center gap-4">
        {!hideUserInfo && session?.user && (
          <>
            <span className="text-sm text-slate-400">
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
