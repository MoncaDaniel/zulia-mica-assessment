export const maxDuration = 120;

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runMicaExtractionStream, scoreGroup, overallScore, complianceFlag } from "@/lib/ai/extraction";
import { fetchCoinFinancials, formatFinancialsForPrompt } from "@/lib/ai/coin-data";
import { fetchLegalEntities, formatLegalEntitiesForPrompt } from "@/lib/ai/legal-entity";
import { scrapeProjectPages, formatScrapedPagesForPrompt, scrapeMarketingComms, formatMarketingCommsForPrompt } from "@/lib/ai/web-scraper";
import type { MicaGroupData } from "@/lib/ai/types";

/**
 * POST /api/assessments/[id]/analyze — Server-Sent Events stream
 *
 * Events:
 *   { type: "fetching_market_data" }
 *   { type: "financial_data", data: CoinFinancials | null }
 *   { type: "group_complete", groupKey: string, data: MicaGroupData }
 *   { type: "narrative_complete", narrative: string }
 *   { type: "done", tokensUsed: number }
 *   { type: "error", message: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const assessment = await prisma.assessment.findUnique({
    where:   { id: params.id },
    include: { sections: true, pdf: true },
  });
  if (!assessment) return new Response("Not found", { status: 404 });

  if (!assessment.pdf) {
    return new Response("No PDF uploaded for this assessment", { status: 422 });
  }

  const pdfBuffer = Buffer.from(assessment.pdf.data);

  await prisma.assessment.update({
    where: { id: params.id },
    data:  { aiStatus: "PENDING", aiError: null },
  });

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  function emit(data: object) {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)).catch(() => {});
  }

  const collectedGroups: Partial<Record<string, MicaGroupData>> = {};

  void (async () => {
    const routeStart = Date.now();
    const SEP  = "━".repeat(56);
    const pdfName = assessment.pdfName ?? "whitepaper.pdf";

    console.log(`[analyze] ${SEP}`);
    console.log(`[analyze] Assessment : ${assessment.tokenName}${assessment.ticker ? ` (${assessment.ticker})` : ""} · ${pdfName}`);
    console.log(`[analyze] ID         : ${params.id}`);

    try {
      // ── Step 1: Market data + legal entity + web scrape (parallel) ──────────
      console.log(`[analyze] Step 1/4   · Fetching enrichment data (CoinGecko + GLEIF + web)…`);
      emit({ type: "fetching_market_data" });

      const [financials, legalEntities] = await Promise.all([
        fetchCoinFinancials(assessment.tokenName, assessment.ticker ?? undefined),
        fetchLegalEntities(assessment.tokenName),
      ]);

      emit({ type: "financial_data", data: financials });

      if (financials) {
        const capStr = financials.market_cap_usd
          ? `$${(financials.market_cap_usd / 1e6).toFixed(0)}M`
          : "cap unknown";
        console.log(`[analyze]            CoinGecko: ${financials.name} (${financials.symbol}) · rank #${financials.market_cap_rank ?? "?"} · ${capStr}`);
      } else {
        console.log(`[analyze]            CoinGecko: no match`);
      }

      if (legalEntities.length > 0) {
        console.log(`[analyze]            GLEIF: ${legalEntities.length} legal entity match(es) — ${legalEntities.map(e => `${e.legalName} (${e.jurisdiction})`).join(", ")}`);
      } else {
        console.log(`[analyze]            GLEIF: no legal entity match`);
      }

      // ── Step 2: Targeted web scrape + marketing comms audit (parallel) ──
      console.log(`[analyze] Step 2/4   · Scraping project web pages + marketing audit…`);
      const [scrapedPages, marketingAudit] = await Promise.all([
        scrapeProjectPages(
          financials?.homepage ?? null,
          financials?.github_url ?? null,
          assessment.tokenName,
        ),
        scrapeMarketingComms(
          financials?.homepage ?? null,
          assessment.tokenName,
        ),
      ]);

      // ── Step 3: PDF extraction ────────────────────────────────────────────
      console.log(`[analyze] Step 3/4   · Extracting PDF content…`);
      // (pdf-extract logs the details)

      // ── Step 4: Claude analysis ───────────────────────────────────────────
      console.log(`[analyze] Step 4/4   · Starting Claude analysis…`);

      // Build enrichment context — each source clearly labeled with URL
      const financialContext  = financials              ? formatFinancialsForPrompt(financials)               : undefined;
      const legalContext      = legalEntities.length > 0 ? formatLegalEntitiesForPrompt(legalEntities)         : undefined;
      const webContext        = scrapedPages.length > 0  ? formatScrapedPagesForPrompt(scrapedPages)           : undefined;
      const mktgContext       = formatMarketingCommsForPrompt(marketingAudit) || undefined;

      const enrichmentContext = [financialContext, legalContext, webContext, mktgContext]
        .filter(Boolean)
        .join("\n\n") || undefined;

      await runMicaExtractionStream(assessment.tokenName, pdfBuffer, pdfName, enrichmentContext, {
        onGroup: async (groupKey, data) => {
          collectedGroups[groupKey] = data;
          emit({ type: "group_complete", groupKey, data });
          await persistGroup(params.id, groupKey, data, scoreGroup(data), assessment.sections)
            .catch((e) => console.error(`[analyze] Persist failed for ${groupKey}:`, e));
        },

        onNarrative: async (narrative) => {
          emit({ type: "narrative_complete", narrative });
          const score = overallScore(collectedGroups);
          const flag  = complianceFlag(score);
          prisma.assessment
            .update({
              where: { id: params.id },
              data: {
                aiStatus:     "COMPLETED",
                aiNarrative:  narrative,
                aiError:      null,
                overallScore: score ?? undefined,
                flag:         flag ?? undefined,
              },
            })
            .catch(console.error);
        },

        onDone: (tokensUsed) => {
          const totalMs = Date.now() - routeStart;
          const score   = overallScore(collectedGroups);
          const flag    = complianceFlag(score);
          const groups  = Object.keys(collectedGroups).length;
          console.log(`[analyze] Complete   · score ${score ?? "N/A"}% ${flag ?? ""} · ${groups}/12 groups · ${(totalMs / 1000).toFixed(1)}s total`);
          console.log(`[analyze] ${SEP}`);
          if (session.user?.id) {
            prisma.auditLog
              .create({
                data: {
                  assessmentId: params.id,
                  userId:       session.user.id,
                  action:       "AI_ANALYSIS_COMPLETED",
                  metadata:     { tokensUsed, hadMarketData: !!financials },
                },
              })
              .catch(console.error);
          }
          emit({ type: "done", tokensUsed });
          writer.close().catch(() => {});
        },
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[analyze] ${SEP}`);
      console.error(`[analyze] ERROR: ${msg}`);
      console.error(`[analyze] ${SEP}`);
      prisma.assessment
        .update({ where: { id: params.id }, data: { aiStatus: "FAILED", aiError: msg } })
        .catch(console.error);
      emit({ type: "error", message: msg });
      writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function persistGroup(
  assessmentId: string,
  groupKey: string,
  data: MicaGroupData,
  groupScore: number | null,
  existingSections: { id: string; sectionKey: string }[],
) {
  const existing = existingSections.find((s) => s.sectionKey === groupKey);
  const payload  = { sectionScore: groupScore ?? undefined, aiData: data as object, completedAt: new Date() };
  if (existing) {
    await prisma.assessmentSection.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.assessmentSection.create({
      data: { assessmentId, sectionKey: groupKey, sectionName: groupKey, data: {}, ...payload },
    });
  }
}
