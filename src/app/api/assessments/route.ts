import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchWhitepaperPdf, PDF_MAX_BYTES } from "@/lib/whitepaper-fetch";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const flag   = searchParams.get("flag");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (flag)   where.flag   = flag;

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      createdBy:  { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log("[POST /api/assessments] session.user.id =", session.user?.id);

  const contentType = req.headers.get("content-type") ?? "";

  // ── Multipart upload (PDF + token name) ──────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const tokenName     = (formData.get("tokenName") as string | null)?.trim();
    const ticker        = (formData.get("ticker")    as string | null)?.trim() || undefined;
    const pdfFile       = formData.get("pdf") as File | null;
    const whitepaperUrl = (formData.get("whitepaperUrl") as string | null)?.trim() || undefined;

    if (!tokenName) {
      return NextResponse.json({ error: "tokenName is required" }, { status: 422 });
    }
    if (pdfFile && whitepaperUrl) {
      return NextResponse.json({ error: "Provide either a PDF file or a URL, not both" }, { status: 422 });
    }
    if (!pdfFile && !whitepaperUrl) {
      return NextResponse.json({ error: "A whitepaper PDF (file upload or URL) is required" }, { status: 422 });
    }
    if (pdfFile && pdfFile.type !== "application/pdf") {
      return NextResponse.json({ error: "The uploaded file must be a PDF" }, { status: 422 });
    }
    if (pdfFile && pdfFile.size > PDF_MAX_BYTES) {
      return NextResponse.json(
        { error: `PDF too large (${(pdfFile.size / 1_048_576).toFixed(1)} MB — max 20 MB)` },
        { status: 413 },
      );
    }

    let pdfBuffer: Buffer;
    let pdfName: string;
    let pdfSourceUrl: string | undefined;

    if (pdfFile) {
      pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
      pdfName   = pdfFile.name;
    } else {
      const fetched = await fetchWhitepaperPdf(whitepaperUrl!);
      if (!fetched.ok) {
        return NextResponse.json({ error: fetched.error }, { status: 422 });
      }
      pdfBuffer    = fetched.buffer;
      pdfName      = fetched.filename;
      pdfSourceUrl = whitepaperUrl;
    }

    const assessment = await prisma.assessment.create({
      data: {
        tokenName,
        ticker,
        createdById: session.user.id,
        pdfName,
        pdfSourceUrl,
        pdf: { create: { data: pdfBuffer } },
      },
    });

    await prisma.auditLog.create({
      data: {
        assessmentId: assessment.id,
        userId:       session.user.id,
        action:       "CREATED",
        metadata:     { tokenName, pdfName, pdfSourceUrl },
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  }

  // ── JSON fallback (legacy — no PDF) ──────────────────────────────────────
  let body: { tokenName?: string; ticker?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tokenName = body.tokenName?.trim();
  if (!tokenName) {
    return NextResponse.json({ error: "tokenName is required" }, { status: 422 });
  }

  const assessment = await prisma.assessment.create({
    data: {
      tokenName,
      ticker: body.ticker?.trim() || undefined,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: assessment.id,
      userId:       session.user.id,
      action:       "CREATED",
      metadata:     { tokenName },
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}
