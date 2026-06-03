import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      sections: true,
      auditLogs: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assessment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tokenName, ticker } = body;

  const assessment = await prisma.assessment.update({
    where: { id: params.id },
    data: {
      ...(tokenName && { tokenName }),
      ...(ticker !== undefined && { ticker }),
    },
  });

  return NextResponse.json(assessment);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.assessment.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
