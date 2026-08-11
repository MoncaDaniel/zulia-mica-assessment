import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegistrySchema = z.object({
  listedPublicly: z.boolean(),
});

// Toggles whether a single assessment's token name/ticker/flag/date are
// surfaced in the public "already assessed?" search (see
// /api/public/registry/check). Deliberately narrow: REVIEWER/ADMIN only,
// APPROVED assessments only, and it only ever writes the one boolean —
// nothing else about the assessment is touched or exposed by this route.
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

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: { listedPublicly: parsed.data.listedPublicly },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: params.id,
      userId: session.user.id,
      action: parsed.data.listedPublicly ? "LISTED_PUBLICLY" : "UNLISTED_PUBLICLY",
    },
  });

  return NextResponse.json({ listedPublicly: updated.listedPublicly });
}
