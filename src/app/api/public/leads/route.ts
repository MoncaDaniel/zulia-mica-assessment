import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Unauthenticated by design — this is where the public registry's "request
// an assessment" form lands. Just writes a row; an ADMIN reads it back via
// /leads and reaches out manually. No email is sent from here.
const LeadSchema = z.object({
  tokenName: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(30),
});

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

  await prisma.leadRequest.create({
    data: {
      tokenName: parsed.data.tokenName || undefined,
      email: parsed.data.email,
      phone: parsed.data.phone,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
