import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  tokenName: z.string().min(1),
  ticker: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const flag = searchParams.get("flag");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (flag) where.flag = flag;

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      sections: { select: { sectionKey: true, sectionScore: true, completedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const assessment = await prisma.assessment.create({
    data: {
      tokenName: parsed.data.tokenName,
      ticker: parsed.data.ticker,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: assessment.id,
      userId: session.user.id,
      action: "CREATED",
      metadata: { tokenName: assessment.tokenName },
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}
