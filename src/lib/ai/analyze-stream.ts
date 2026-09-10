import { prisma } from "@/lib/prisma";
import { runMicaExtractionStream, scoreGroup, overallScore, complianceFlag } from "@/lib/ai/extraction";
import { MICA_GROUPS } from "@/lib/ai/mica-groups";
import { fetchCoinFinancials, formatFinancialsForPrompt } from "@/lib/ai/coin-data";
import { fetchLegalEntities, formatLegalEntitiesForPrompt } from "@/lib/ai/legal-entity";
import {
  scrapeProjectPages,
  formatScrapedPagesForPrompt,
  scrapeMarketingComms,
  formatMarketingCommsForPrompt,
} from "@/lib/ai/web-scraper";
import type { MicaGroupData } from "@/lib/ai/types";

/**
 * Shared Server-Sent Events analysis stream. Both the authenticated
 * (`/api/assessments/[id]/analyze`) and the public
 * (`/api/public/assessments/[id]/analyze`) routes call this — the only
 * difference is who is allowed to reach it and whether there's a `userId`
 * to attribute the audit-log entry to.
 *
 * Events:
 *   { type: "fetching_market_data" }
 *   { type: "financial_data", data: CoinFinancials | null }
 *   { type: "group_complete", groupKey, data }
 *   { type: "narrative_complete", narrative }
 *   { type: "done", tokensUsed }
 *   { type: "error", message }
 */
export async function streamAnalysis(
  assessmentId: string,
  opts: { userId?: string | null } = {},
): Promise<Response> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { sections: true, pdf: true },
  });
  if (!assessment) return new Response("Not found", { status: 404 });
  if (!assessment.pdf) {
    return new Response("No PDF uploaded for this assessment", { status: 422 });
  }

  const pdfBuffer = Buffer.from(assessment.pdf.data);

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { aiStatus: "PENDING", aiError: null },
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
    const SEP = "━".repeat(56);
    const pdfName = assessment.pdfName ?? "whitepaper.pdf";

    console.log(`[analyze] ${SEP}`);
    console.log(
      `[analyze] Assessment : ${assessment.tokenName}${assessment.ticker ? ` (${assessment.ticker})` : ""} · ${pdfName}`,
    );
    console.log(`[analyze] ID         : ${assessmentId}`);

    try {
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
        console.log(
          `[analyze]            CoinGecko: ${financials.name} (${financials.symbol}) · rank #${financials.market_cap_rank ?? "?"} · ${capStr}`,
        );
        await prisma.assessment
          .update({ where: { id: assessmentId }, data: { aiFinancials: financials as object } })
          .catch((e) => console.error(`[analyze] Financials persist failed:`, e));
      } else {
        console.log(`[analyze]            CoinGecko: no match`);
      }

      if (legalEntities.length > 0) {
        console.log(
          `[analyze]            GLEIF: ${legalEntities.length} legal entity match(es) — ${legalEntities
            .map((e) => `${e.legalName} (${e.jurisdiction})`)
            .join(", ")}`,
        );
      } else {
        console.log(`[analyze]            GLEIF: no legal entity match`);
      }

      console.log(`[analyze] Step 2/4   · Scraping project web pages + marketing audit…`);
      const [scrapedPages, marketingAudit] = await Promise.all([
        scrapeProjectPages(
          financials?.homepage ?? null,
          financials?.github_url ?? null,
          assessment.tokenName,
        ),
        scrapeMarketingComms(financials?.homepage ?? null, assessment.tokenName),
      ]);

      console.log(`[analyze] Step 3/4   · Extracting PDF content…`);
      console.log(`[analyze] Step 4/4   · Starting Claude analysis…`);

      const financialContext = financials ? formatFinancialsForPrompt(financials) : undefined;
      const legalContext =
        legalEntities.length > 0 ? formatLegalEntitiesForPrompt(legalEntities) : undefined;
      const webContext = scrapedPages.length > 0 ? formatScrapedPagesForPrompt(scrapedPages) : undefined;
      const mktgContext = formatMarketingCommsForPrompt(marketingAudit) || undefined;

      const enrichmentContext =
        [financialContext, legalContext, webContext, mktgContext].filter(Boolean).join("\n\n") ||
        undefined;

      await runMicaExtractionStream(assessment.tokenName, pdfBuffer, pdfName, enrichmentContext, {
        onGroup: async (groupKey, data) => {
          collectedGroups[groupKey] = data;
          emit({ type: "group_complete", groupKey, data });
          await persistGroup(assessmentId, groupKey, data, scoreGroup(data), assessment.sections).catch(
            (e) => console.error(`[analyze] Persist failed for ${groupKey}:`, e),
          );
        },

        onNarrative: async (narrative) => {
          emit({ type: "narrative_complete", narrative });
          const score = overallScore(collectedGroups);
          const flag = complianceFlag(score, collectedGroups);
          await prisma.assessment
            .update({
              where: { id: assessmentId },
              data: {
                aiStatus: "COMPLETED",
                aiNarrative: narrative,
                aiError: null,
                overallScore: score ?? undefined,
                flag: flag ?? undefined,
              },
            })
            .catch((e) => console.error(`[analyze] Final status update failed:`, e));
        },

        onDone: async (tokensUsed) => {
          const totalMs = Date.now() - routeStart;
          const score = overallScore(collectedGroups);
          const flag = complianceFlag(score, collectedGroups);
          const groups = Object.keys(collectedGroups).length;
          console.log(
            `[analyze] Complete   · score ${score ?? "N/A"}% ${flag ?? ""} · ${groups}/${MICA_GROUPS.length} groups · ${(totalMs / 1000).toFixed(1)}s total`,
          );
          console.log(`[analyze] ${SEP}`);
          if (opts.userId) {
            await prisma.auditLog
              .create({
                data: {
                  assessmentId,
                  userId: opts.userId,
                  action: "AI_ANALYSIS_COMPLETED",
                  metadata: { tokensUsed, hadMarketData: !!financials },
                },
              })
              .catch((e) => console.error(`[analyze] Audit log write failed:`, e));
          }
          emit({ type: "done", tokensUsed });
          await writer.close().catch(() => {});
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[analyze] ${SEP}`);
      console.error(`[analyze] ERROR: ${msg}`);
      console.error(`[analyze] ${SEP}`);
      prisma.assessment
        .update({ where: { id: assessmentId }, data: { aiStatus: "FAILED", aiError: msg } })
        .catch(console.error);
      emit({ type: "error", message: msg });
      writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
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
  const payload = { sectionScore: groupScore ?? undefined, aiData: data as object, completedAt: new Date() };
  if (existing) {
    await prisma.assessmentSection.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.assessmentSection.create({
      data: { assessmentId, sectionKey: groupKey, sectionName: groupKey, data: {}, ...payload },
    });
  }
}
