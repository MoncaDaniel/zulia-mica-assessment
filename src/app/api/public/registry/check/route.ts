import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Unauthenticated by design — this is the "already assessed?" self-serve
// check, so it must work before anyone signs up. To keep it from becoming a
// confidentiality leak, the query is deliberately narrow twice over:
//   1. DB filter: only APPROVED assessments an analyst has explicitly opted
//      into the registry (listedPublicly: true) are even eligible.
//   2. Field selection: only tokenName/ticker/flag/date are ever selected —
//      score, reviewer notes, analyst identity, and whitepaper data never
//      leave the DB for this route, so there's no field to accidentally leak.
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 20;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Enter at least ${MIN_QUERY_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  const results = await prisma.assessment.findMany({
    where: {
      status: "APPROVED",
      listedPublicly: true,
      OR: [
        { tokenName: { contains: q, mode: "insensitive" } },
        { ticker: { contains: q, mode: "insensitive" } },
      ],
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
