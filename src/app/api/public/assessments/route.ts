export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchWhitepaperPdf, PDF_MAX_BYTES } from "@/lib/whitepaper-fetch";
import {
  FREE_USED_COOKIE,
  RUN_GRANT_COOKIE,
  ipHashFrom,
  hasFreeUsedCookie,
  readGrantCookie,
  checkAnonAllowance,
  recordAnonRun,
  consumeGrant,
  getPublicUserId,
  freeUsedCookie,
} from "@/lib/anon";

/**
 * POST /api/public/assessments — create an assessment with no login.
 *
 * Gated: one free run per browser (signed cookie) / per hashed IP / under a
 * global daily cap. A valid single-use grant token (redeemed via the
 * mica_run_grant cookie) bypasses the gate for exactly one extra run.
 */
export async function POST(req: NextRequest) {
  const ipHash = ipHashFrom((k) => req.headers.get(k), req.ip);
  const hasFreeCookie = hasFreeUsedCookie(req.cookies.get(FREE_USED_COOKIE)?.value);
  const grantToken = readGrantCookie(req.cookies.get(RUN_GRANT_COOKIE)?.value);

  const allowance = await checkAnonAllowance({ ipHash, hasFreeCookie, grantToken });
  if (!allowance.ok) {
    return NextResponse.json(
      { error: allowance.reason ?? "Free assessment limit reached.", code: allowance.code },
      { status: 429 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const tokenName = (formData.get("tokenName") as string | null)?.trim();
  const ticker = (formData.get("ticker") as string | null)?.trim() || undefined;
  const pdfFile = formData.get("pdf") as File | null;
  const whitepaperUrl = (formData.get("whitepaperUrl") as string | null)?.trim() || undefined;

  if (!tokenName) {
    return NextResponse.json({ error: "Token name is required." }, { status: 422 });
  }
  if (tokenName.length > 120) {
    return NextResponse.json({ error: "Token name is too long." }, { status: 422 });
  }
  if (pdfFile && whitepaperUrl) {
    return NextResponse.json({ error: "Provide either a PDF file or a URL, not both." }, { status: 422 });
  }
  if (!pdfFile && !whitepaperUrl) {
    return NextResponse.json(
      { error: "A whitepaper PDF (file upload or URL) is required." },
      { status: 422 },
    );
  }
  if (pdfFile && pdfFile.type !== "application/pdf") {
    return NextResponse.json({ error: "The uploaded file must be a PDF." }, { status: 422 });
  }
  if (pdfFile && pdfFile.size > PDF_MAX_BYTES) {
    return NextResponse.json(
      { error: `PDF too large (${(pdfFile.size / 1_048_576).toFixed(1)} MB — max 20 MB).` },
      { status: 413 },
    );
  }

  let pdfBuffer: Buffer;
  let pdfName: string;
  let pdfSourceUrl: string | undefined;

  if (pdfFile) {
    pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    pdfName = pdfFile.name;
  } else {
    const fetched = await fetchWhitepaperPdf(whitepaperUrl!);
    if (!fetched.ok) {
      return NextResponse.json({ error: fetched.error }, { status: 422 });
    }
    pdfBuffer = fetched.buffer;
    pdfName = fetched.filename;
    pdfSourceUrl = whitepaperUrl;
  }

  const publicUserId = await getPublicUserId();

  const assessment = await prisma.assessment.create({
    data: {
      tokenName,
      ticker,
      createdById: publicUserId,
      pdfName,
      pdfSourceUrl,
      pdf: { create: { data: pdfBuffer } },
    },
    select: { id: true },
  });

  await recordAnonRun(ipHash, assessment.id);
  if (allowance.grantId) await consumeGrant(allowance.grantId, ipHash);

  await prisma.auditLog
    .create({
      data: {
        assessmentId: assessment.id,
        userId: publicUserId,
        action: allowance.grantId ? "CREATED_PUBLIC_GRANT" : "CREATED_PUBLIC",
        metadata: { tokenName, pdfName, pdfSourceUrl, ipHash },
      },
    })
    .catch(() => {});

  const res = NextResponse.json({ id: assessment.id }, { status: 201 });
  const c = freeUsedCookie();
  res.cookies.set(c.name, c.value, c.options);
  // The grant (if any) has now been spent — drop the bridge cookie.
  res.cookies.set(RUN_GRANT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
