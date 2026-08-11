import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Unauthenticated by design — this backs the public "already assessed?"
// list, so it must work before anyone signs up. To keep it from becoming a
// confidentiality leak, the query is deliberately narrow twice over:
//   1. DB filter: only APPROVED assessments an analyst has explicitly opted
//      into the registry (listedPublicly: true) are even eligible.
//   2. Field selection: only tokenName/ticker/flag/date are ever selected —
//      score, reviewer notes, analyst identity, and whitepaper data never
//      leave the DB for this route, so there's no field to accidentally leak.
// `q` is optional: omitted (or blank) returns the full public list — the
// list itself is the landing page, search is just a filter on top of it.
const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 100;

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
      tokenName: true,
      ticker: true,
      flag: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_RESULTS,
  });

  return NextResponse.json({
    results: results.map((r) => ({
      tokenName: r.tokenName,
      ticker: r.ticker,
      flag: r.flag,
      checkedAt: r.updatedAt.toISOString(),
    })),
  });
}
