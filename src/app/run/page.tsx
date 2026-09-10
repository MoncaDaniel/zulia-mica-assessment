import Link from "next/link";
import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { Footer } from "@/components/layout/Footer";
import { RunForm } from "@/components/public/RunForm";
import { RequestAnotherForm } from "@/components/public/RequestAnotherForm";
import {
  FREE_USED_COOKIE,
  RUN_GRANT_COOKIE,
  ipHashFrom,
  hasFreeUsedCookie,
  readGrantCookie,
  checkAnonAllowance,
} from "@/lib/anon";

export const metadata: Metadata = {
  title: "Run a free MiCA assessment · MiCA ESMA",
  description: "Upload a crypto-asset whitepaper and get a MiCA Annex I disclosure assessment.",
};

// Reads per-request cookies/headers — must not be statically rendered.
export const dynamic = "force-dynamic";

const GRANT_NOTICE: Record<string, string> = {
  expired: "That link has expired. Request a fresh one below.",
  used: "That link was already used. Request another below.",
  invalid: "That link wasn't valid. Request one below.",
};

export default async function RunPage({
  searchParams,
}: {
  searchParams: { grant?: string; used?: string };
}) {
  const h = headers();
  const c = cookies();

  const ipHash = ipHashFrom((k) => h.get(k));
  const hasFreeCookie = hasFreeUsedCookie(c.get(FREE_USED_COOKIE)?.value);
  const grantToken = readGrantCookie(c.get(RUN_GRANT_COOKIE)?.value);

  const allowance = await checkAnonAllowance({ ipHash, hasFreeCookie, grantToken });
  const viaGrant = allowance.ok && !!allowance.grantId;
  const grantNotice = searchParams.grant ? GRANT_NOTICE[searchParams.grant] : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-12">
      <div className="mx-auto w-full max-w-xl flex-1">
        <div className="mb-8">
          <Link href="/" className="font-display text-xl font-bold text-white">
            MiCA <span className="text-brand-500">ESMA</span>
          </Link>
        </div>

        {grantNotice && (
          <p className="mb-6 rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-xs text-amber-300">
            {grantNotice}
          </p>
        )}

        {allowance.ok ? (
          <>
            <h1 className="font-display text-2xl font-bold text-white">Run a free assessment</h1>
            <p className="mt-2 text-sm text-slate-400">
              Give the token&apos;s name and its whitepaper. Claude checks it against every MiCA
              Regulation (EU) 2023/1114 Annex I disclosure requirement and produces a downloadable
              report with the whitepaper passages behind each finding.
            </p>
            <div className="mt-8">
              <RunForm viaGrant={viaGrant} />
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-white">One per visitor</h1>
            <p className="mt-2 text-sm text-slate-400">
              {allowance.reason ?? "You've already used your free assessment."}
            </p>
            <div className="mt-8">
              <RequestAnotherForm />
            </div>
            <p className="mt-6 text-center text-sm text-slate-500">
              Already assessed?{" "}
              <Link href="/check" className="text-brand-400 hover:underline">
                Search the registry
              </Link>
            </p>
          </>
        )}

        <Footer />
      </div>
    </div>
  );
}
