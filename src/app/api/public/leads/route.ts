import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ipHashFrom } from "@/lib/anon";

/**
 * Unauthenticated by design — lands both the public registry's "request an
 * assessment" form and the "request another free assessment" flow. Writes a
 * LeadRequest row; an ADMIN reads it back via /leads and (for a second free
 * run) issues a single-use grant link. No email is sent from here.
 *
 * De-dupes: a NEW request from the same email OR the same hashed IP within
 * the last 24h is accepted silently (returns { deduped: true }) rather than
 * creating a second row, so a double-submit or an impatient repeat doesn't
 * spam the leads list.
 */
const LeadSchema = z.object({
  tokenName: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(30).optional(),
  note: z.string().trim().max(2000).optional(),
});

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const ipHash = ipHashFrom((k) => req.headers.get(k), req.ip);
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);

  const existing = await prisma.leadRequest.findFirst({
    where: {
      status: "NEW",
      createdAt: { gte: since },
      OR: [{ email: parsed.data.email }, { ipHash }],
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
  }

  await prisma.leadRequest.create({
    data: {
      tokenName: parsed.data.tokenName || undefined,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      note: parsed.data.note || undefined,
      ipHash,
      status: "NEW",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
