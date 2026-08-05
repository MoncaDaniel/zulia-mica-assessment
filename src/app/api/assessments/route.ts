import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PDF_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
// Separate, smaller budget than the analyze step's maxDuration — this fetch
// happens once at creation time and must not eat into the Claude call's budget.
const URL_FETCH_TIMEOUT_MS = 20_000;

type FetchResult =
  | { ok: true; buffer: Buffer; filename: string }
  | { ok: false; error: string };

// Fetches a whitepaper PDF from a user-provided URL exactly once, at creation
// time, so the result can be stored and reused — extraction never re-fetches
// this URL, so it can't be the thing that blows the analyze route's timeout.
async function fetchWhitepaperPdf(url: string): Promise<FetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "URL must start with http:// or https://" };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(URL_FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not fetch that URL: ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, error: `That URL returned HTTP ${res.status}.` };
  }

  const contentType   = res.headers.get("content-type") ?? "";
  const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10);
  if (contentLength > PDF_MAX_BYTES) {
    return { ok: false, error: `PDF too large (${(contentLength / 1_048_576).toFixed(1)} MB — max 20 MB).` };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > PDF_MAX_BYTES) {
    return { ok: false, error: `PDF too large (${(buffer.length / 1_048_576).toFixed(1)} MB — max 20 MB).` };
  }

  // Some servers mislabel content-type (or serve an HTML landing page instead
  // of the actual file) — sniff the real PDF magic bytes rather than trusting
  // the header alone.
  const looksLikePdf =
    contentType.includes("application/pdf") || buffer.subarray(0, 5).toString("ascii") === "%PDF-";

  if (!looksLikePdf) {
    return {
      ok: false,
      error:
        `That URL didn't return a PDF (got "${contentType || "unknown content type"}"). ` +
        `It may be a landing page rather than a direct link — try the direct PDF link, ` +
        `or download it and upload the file instead.`,
    };
  }

  const rawName = parsed.pathname.split("/").filter(Boolean).pop() || "whitepaper.pdf";
  const filename = rawName.toLowerCase().endsWith(".pdf") ? rawName : `${rawName}.pdf`;

  return { ok: true, buffer, filename };
}

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
