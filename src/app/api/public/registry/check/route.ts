import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Unauthenticated by design — this backs the public "already assessed?"
// list, so it must work before anyone signs up. To keep it from becoming a
// confidentiality leak, the query is deliberately narrow twice over:
//   1. DB filter: only APPROVED assessments an analyst has explicitly opted
//      into the registry (listedPublicly: true) are even eligible.
//   2. Field selection: token facts + flag + a truncated narrative teaser
//      (plus the id, needed to link a download) are all that's ever
//      selected here — exact score, reviewer notes, analyst identity, and
//      the full whitepaper-derived narrative never leave the DB via this
//      route. The `id` on its own reveals nothing: the download route
//      (/api/public/assessments/[id]/pdf) independently re-checks
//      listedPublicly AND publicPdfEnabled before ever generating a PDF, so
//      an id alone can't be used to pull a report that isn't both listed
//      and explicitly marked downloadable.
// `q` is optional: omitted (or blank) returns the full public list — the
// list itself is the landing page, search is just a filter on top of it.
const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 100;
const TEASER_MAX_CHARS = 220;

function teaser(narrative: string | null): string | null {
  if (!narrative) return null;
  const trimmed = narrative.trim();
  if (trimmed.length <= TEASER_MAX_CHARS) return trimmed;
  const cut = trimmed.slice(0, TEASER_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : TEASER_MAX_CHARS)}…`;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  const results = await prisma.assessment.findMany({
    where: {
      status: "APPROVED",
      listedPublicly: true,
      ...(q
        ? {
            OR: [
              { tokenName: { contains: q, mode: "insensitive" } },
              { ticker: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      tokenName: true,
      ticker: true,
      flag: true,
      updatedAt: true,
      aiNarrative: true,
      publicPdfEnabled: true,
      sections: {
        where: { sectionKey: "s01_general_info" },
        select: { data: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_RESULTS,
  });

  return NextResponse.json({
    results: results.map((r) => {
      const general = (r.sections[0]?.data ?? {}) as Record<string, unknown>;
      return {
        id: r.id,
        tokenName: r.tokenName,
        ticker: r.ticker,
        flag: r.flag,
        checkedAt: r.updatedAt.toISOString(),
        chain: typeof general.chain === "string" ? general.chain || null : null,
        classification:
          typeof general.tokenClassification === "string" ? general.tokenClassification || null : null,
        teaser: teaser(r.aiNarrative),
        canDownload: r.publicPdfEnabled,
      };
    }),
  });
}
