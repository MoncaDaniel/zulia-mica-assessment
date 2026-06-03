// Allow up to 60 s — Claude + PDF fetch can take 30–45 s
export const maxDuration = 60;

/**
 * POST /api/assessments/[id]/analyze
 *
 * Accepts a list of source URLs, runs Claude MiCA extraction,
 * and stores per-field AI suggestions in AssessmentSection.aiData.
 *
 * The scoring engine (AssessmentField.fieldValue) is NEVER touched here.
 * Analysts review the AI suggestions and can accept them individually.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runMicaExtraction } from "@/lib/ai/extraction";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Top-level crash guard — ensures we always return a valid JSON response
  try {
    return await handleAnalyze(req, params.id);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze] Unhandled error:", msg);
    // Best-effort status update
    try {
      await prisma.assessment.update({
        where: { id: params.id },
        data: { aiStatus: "FAILED", aiError: `Unexpected error: ${msg}` },
      });
    } catch { /* ignore — DB might be unavailable */ }
    return NextResponse.json(
      { error: "Internal server error", detail: msg },
      { status: 500 },
    );
  }
}

async function handleAnalyze(req: NextRequest, assessmentId: string) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Load assessment ───────────────────────────────────────────────────────
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { sections: true },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let sourceUrls: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body.sourceUrls)) {
      sourceUrls = body.sourceUrls
        .map((u: unknown) => String(u).trim())
        .filter(Boolean);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (sourceUrls.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one sourceUrl" },
      { status: 422 },
    );
  }

  // Validate URL format
  const invalid = sourceUrls.filter((u) => {
    try { new URL(u); return false; } catch { return true; }
  });
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid URLs: ${invalid.join(", ")}` },
      { status: 422 },
    );
  }

  // ── Mark as PENDING ───────────────────────────────────────────────────────
  console.log(`[analyze] Starting for assessment ${assessmentId}, URLs: ${sourceUrls.join(", ")}`);
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { aiStatus: "PENDING", aiError: null, aiSourceUrls: sourceUrls },
  });
  console.log("[analyze] Marked PENDING, calling Claude...");

  // ── Run Claude extraction ─────────────────────────────────────────────────
  let result;
  try {
    result = await runMicaExtraction(assessment.tokenName, sourceUrls);
    console.log(`[analyze] Claude done — tokens: ${result.tokensUsed}, sections: ${Object.keys(result.sections).length}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze] Claude extraction failed:", msg);
    try {
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { aiStatus: "FAILED", aiError: msg },
      });
    } catch { /* ignore */ }
    return NextResponse.json(
      { error: "AI extraction failed", detail: msg },
      { status: 502 },
    );
  }

  // ── Persist results ───────────────────────────────────────────────────────
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update top-level assessment
      await tx.assessment.update({
        where: { id: assessmentId },
        data: {
          aiStatus:    "COMPLETED",
          aiNarrative: result.narrative,
          aiError:     null,
        },
      });

      // 2. Upsert each section's aiData
      for (const [sectionKey, sectionAiData] of Object.entries(result.sections)) {
        if (!sectionAiData) continue;

        const existing = assessment.sections.find((s) => s.sectionKey === sectionKey);

        if (existing) {
          await tx.assessmentSection.update({
            where: { id: existing.id },
            data: { aiData: sectionAiData as object },
          });
        } else {
          await tx.assessmentSection.create({
            data: {
              assessmentId,
              sectionKey,
              sectionName: sectionKey,
              data:        {},
              aiData:      sectionAiData as object,
            },
          });
        }
      }

      // 3. Audit log (best-effort — skip if userId missing)
      if (session.user?.id) {
        await tx.auditLog.create({
          data: {
            assessmentId,
            userId:   session.user.id,
            action:   "AI_ANALYSIS_COMPLETED",
            metadata: {
              tokensUsed: result.tokensUsed,
              urlCount:   sourceUrls.length,
              sourceUrls,
            },
          },
        });
      }
    });
  } catch (err: unknown) {
    // DB write failed but we have the result — return it anyway
    // The next page reload will show PENDING status but suggestions are in memory
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze] DB persist failed:", msg);
    // Return in-memory result so the frontend can still show suggestions
    return NextResponse.json({
      aiStatus:    "COMPLETED",
      aiNarrative: result.narrative,
      tokensUsed:  result.tokensUsed,
      sections:    result.sections,
      warning:     "Suggestions loaded but could not be saved to DB: " + msg,
    });
  }

  return NextResponse.json({
    aiStatus:    "COMPLETED",
    aiNarrative: result.narrative,
    tokensUsed:  result.tokensUsed,
    sections:    result.sections,
  });
}
