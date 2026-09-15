import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegistrySchema = z.object({
  listedPublicly: z.boolean(),
  // Optional: when omitted, the current publicPdfEnabled value is left
  // untouched (unless listedPublicly is being turned off — see below).
  publicPdfEnabled: z.boolean().optional(),
});

// Toggles whether a single assessment's token name/ticker/flag/date are
// surfaced in the public "already assessed?" search (see
// /api/public/registry/check), and — as a separate, non-implied opt-in —
// whether its full PDF report is publicly downloadable (see
// /api/public/assessments/[id]/pdf). Deliberately narrow: REVIEWER/ADMIN
// only, APPROVED assessments only. publicPdfEnabled can never end up true
// while listedPublicly is false: turning listing off always forces the PDF
// flag off too, so a report can't stay silently downloadable after a token
// is unlisted, and it can't be turned on for a token that isn't listed.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = RegistrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: params.id } });
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessment.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Only APPROVED assessments can be listed in the public registry" },
      { status: 409 }
    );
  }

  const { listedPublicly } = parsed.data;
  const publicPdfEnabled = listedPublicly
    ? parsed.data.publicPdfEnabled ?? assessment.publicPdfEnabled
    : false;

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: { listedPublicly, publicPdfEnabled },
  });

  const actions: string[] = [];
  if (listedPublicly !== assessment.listedPublicly) {
    actions.push(listedPublicly ? "LISTED_PUBLICLY" : "UNLISTED_PUBLICLY");
  }
  if (publicPdfEnabled !== assessment.publicPdfEnabled) {
    actions.push(publicPdfEnabled ? "PUBLIC_PDF_ENABLED" : "PUBLIC_PDF_DISABLED");
  }
  if (actions.length > 0) {
    await prisma.auditLog.createMany({
      data: actions.map((action) => ({
        assessmentId: params.id,
        userId: session.user.id,
        action,
      })),
    });
  }

  return NextResponse.json({
    listedPublicly: updated.listedPublicly,
    publicPdfEnabled: updated.publicPdfEnabled,
  });
}
