import { NextRequest, NextResponse } from "next/server";
import {
  FREE_USED_COOKIE,
  RUN_GRANT_COOKIE,
  ipHashFrom,
  hasFreeUsedCookie,
  readGrantCookie,
  checkAnonAllowance,
} from "@/lib/anon";

/**
 * GET /api/public/assessments/allowance — does this visitor still have a free
 * run? Drives whether /run shows the assessment form or the "request another"
 * panel. Advisory only; POST /api/public/assessments re-checks authoritatively.
 */
export async function GET(req: NextRequest) {
  const ipHash = ipHashFrom((k) => req.headers.get(k), req.ip);
  const hasFreeCookie = hasFreeUsedCookie(req.cookies.get(FREE_USED_COOKIE)?.value);
  const grantToken = readGrantCookie(req.cookies.get(RUN_GRANT_COOKIE)?.value);

  const allowance = await checkAnonAllowance({ ipHash, hasFreeCookie, grantToken });

  return NextResponse.json(
    {
      allowed: allowance.ok,
      code: allowance.code ?? null,
      reason: allowance.reason ?? null,
      viaGrant: allowance.ok && !!allowance.grantId,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
