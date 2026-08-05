/**
 * Legal entity enrichment — GLEIF LEI database (free, no API key required).
 *
 * Searches for legal entities matching the token name. Returns the most
 * relevant matches with LEI, registered address, jurisdiction and status.
 * Source URL is always included so Claude can cite it.
 */

export interface LegalEntityRecord {
  lei:          string;
  legalName:    string;
  status:       string;           // ACTIVE | INACTIVE | PENDING_VALIDATION
  address:      string;           // formatted single string
  city:         string;
  country:      string;           // ISO 2-letter
  jurisdiction: string;
  sourceUrl:    string;           // canonical GLEIF URL for citation
}

const GLEIF_BASE = "https://api.gleif.org/api/v1";

// Relevance score — prefer crypto/tech jurisdictions and active entities
function score(r: LegalEntityRecord, query: string): number {
  let s = 0;
  const name = r.legalName.toLowerCase();
  const q    = query.toLowerCase();

  if (name === q)                          s += 50;
  else if (name.startsWith(q))             s += 30;
  else if (name.includes(q))               s += 15;

  if (r.status === "ACTIVE")               s += 20;

  // Common crypto incorporation jurisdictions
  const cryptoJurisdictions = ["KY", "GB", "CH", "SG", "IE", "MT", "US-DE", "LI", "IM"];
  if (cryptoJurisdictions.includes(r.jurisdiction)) s += 10;

  return s;
}

export async function fetchLegalEntities(
  tokenName: string,
  limit = 4,
): Promise<LegalEntityRecord[]> {
  // Try the exact name first, then strip common token suffixes for broader search
  const queries = [
    tokenName,
    tokenName.replace(/\s+(token|protocol|network|finance|labs|dao)$/i, "").trim(),
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  const seen    = new Set<string>();
  const results: LegalEntityRecord[] = [];

  for (const q of queries) {
    if (results.length >= limit) break;
    try {
      const url = `${GLEIF_BASE}/lei-records?filter[entity.legalName]=${encodeURIComponent(q)}&page[size]=10`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        console.log(`[gleif] HTTP ${res.status} for query "${q}"`);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await res.json() as { data?: any[] };

      for (const item of data?.data ?? []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);

        const e   = item.attributes?.entity ?? {};
        const adr = e.legalAddress ?? {};

        const addressLines = [
          ...(adr.addressLines ?? []),
          adr.city,
          adr.region,
          adr.postalCode,
          adr.country,
        ].filter(Boolean).join(", ");

        const record: LegalEntityRecord = {
          lei:          item.id,
          legalName:    e.legalName?.name ?? "",
          status:       e.status ?? "UNKNOWN",
          address:      addressLines,
          city:         adr.city ?? "",
          country:      adr.country ?? "",
          jurisdiction: e.jurisdiction ?? "",
          sourceUrl:    `https://search.gleif.org/#/record/${item.id}`,
        };
        results.push(record);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 80) : String(err).slice(0, 80);
      console.log(`[gleif] Error for query "${q}": ${msg}`);
    }
  }

  // Sort by relevance and return top N
  return results
    .sort((a, b) => score(b, tokenName) - score(a, tokenName))
    .slice(0, limit);
}

export function formatLegalEntitiesForPrompt(records: LegalEntityRecord[]): string {
  if (!records.length) return "";

  const lines = [
    "=== Legal Entity Registry (GLEIF — gleif.org) ===",
    `Found ${records.length} registered legal entity match(es):`,
    "",
  ];

  for (const r of records) {
    lines.push(
      `Entity: ${r.legalName}`,
      `  LEI:          ${r.lei}`,
      `  Status:       ${r.status}`,
      `  Address:      ${r.address}`,
      `  Jurisdiction: ${r.jurisdiction}`,
      `  Source URL:   ${r.sourceUrl}`,
      "",
    );
  }

  lines.push(
    "Note: Match confidence is approximate — verify jurisdiction relevance.",
    "=================================================",
  );

  return lines.join("\n");
}
