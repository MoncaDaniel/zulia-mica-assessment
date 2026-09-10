import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeGrantToken, GRANT_TTL_DAYS } from "@/lib/anon";

/**
 * POST /api/leads/[id]/grant — issue a single-use "run another free
 * assessment" link for a lead. REVIEWER/ADMIN only. Returns the absolute URL
 * to send to the requester by email; marks the lead CONTACTED.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await prisma.leadRequest.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const token = makeGrantToken();
  const expiresAt = new Date(Date.now() + GRANT_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.runGrant.create({
    data: { token, email: lead.email, note: lead.note ?? undefined, expiresAt },
  });

  await prisma.leadRequest.update({
    where: { id: lead.id },
    data: { status: "CONTACTED", grantedAt: new Date() },
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    req.nextUrl.origin;
  const url = `${origin}/api/public/run-grant?token=${token}`;

  return NextResponse.json({ url, email: lead.email, expiresAt });
}
