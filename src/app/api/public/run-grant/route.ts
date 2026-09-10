import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantCookie } from "@/lib/anon";

/**
 * GET /api/public/run-grant?token=... — redeem a single-use "run another"
 * link. Validates the token, drops a short-lived signed cookie that
 * POST /api/public/assessments will honour once, and sends the visitor to
 * the assessment form. The token isn't marked used here — that happens when
 * the assessment is actually created — so a mis-click doesn't burn it.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const runUrl = new URL("/run", req.nextUrl.origin);

  if (!token) {
    runUrl.searchParams.set("grant", "invalid");
    return NextResponse.redirect(runUrl);
  }

  const grant = await prisma.runGrant.findUnique({ where: { token } });
  if (!grant || grant.usedAt || grant.expiresAt < new Date()) {
    runUrl.searchParams.set("grant", grant?.usedAt ? "used" : "expired");
    return NextResponse.redirect(runUrl);
  }

  runUrl.searchParams.set("grant", "ok");
  const res = NextResponse.redirect(runUrl);
  const c = grantCookie(token);
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
