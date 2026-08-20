// CoinGecko free API — no key required, 10-30 req/min

export interface CoinFinancials {
  id:                   string;
  name:                 string;
  symbol:               string;
  description:          string;
  price_usd:            number | null;
  market_cap_usd:       number | null;
  market_cap_rank:      number | null;
  volume_24h_usd:       number | null;
  price_change_30d_pct: number | null;
  circulating_supply:   number | null;
  total_supply:         number | null;
  max_supply:           number | null;
  ath_usd:              number | null;
  genesis_date:         string | null;
  homepage:             string | null;
  whitepaper_url:       string | null;
  blockchain_explorer:  string | null;
  github_url:           string | null;
  categories:           string[];
  exchanges_listed:     number | null;
  // Community data (twitter removed from CoinGecko free tier)
  reddit_subscribers:          number | null;
  reddit_active_48h:           number | null;
  telegram_channel_user_count: number | null;
  // Developer / GitHub data
  github_stars:               number | null;
  github_forks:               number | null;
  github_total_issues:        number | null;
  github_closed_issues:       number | null;
  github_commits_4_weeks:     number | null;
  github_contributors:        number | null;
  // MiCA significance threshold: Art. 43 — market cap > €5 B (~$5.5 B)
  is_significant_token: boolean;
}

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Title III (ART/EMT) became applicable on 30 June 2024. A token already in
// circulation before that date may fall under the Art. 143(3)-(4) transitional
// regime — issuers get a grace period to seek authorisation rather than an
// instant compliance requirement. This is a hint for manual review, not a
// determination: it doesn't establish token type (ART/EMT vs. utility), nor
// whether the issuer has actually taken the steps the transitional regime
// requires. Never treat this — or any field in this module — as a compliance
// verdict; CoinGecko is a market-data aggregator, not a regulator, and has no
// visibility into an issuer's MiCA authorisation status.
export const MICA_ART_EMT_APPLICATION_DATE = "2024-06-30";

export function mayPredateMicaArtEmt(f: Pick<CoinFinancials, "genesis_date">): boolean {
  return !!f.genesis_date && f.genesis_date < MICA_ART_EMT_APPLICATION_DATE;
}

export const MARKET_DATA_DISCLAIMER =
  "Market presence is not a compliance signal. A token trading on EU-facing exchanges " +
  "may be relying on MiCA's Art. 143 transitional (\"grandfathering\") regime, may be " +
  "traded via a venue or route outside MiCA's scope, or the exchange may simply not yet " +
  "have acted on a whitepaper deficiency — none of that is verifiable from CoinGecko data. " +
  "Confirm current regulatory status against the ESMA and national NCA MiCA registers " +
  "before drawing any conclusion about legal tradability from this card.";

interface CgSearchCoin {
  id:               string;
  name:             string;
  symbol:           string;
  market_cap_rank:  number | null;
}

// Score-based search — avoids matching zero-cap meme tokens over legitimate projects.
// Searches both ticker and name, scores each candidate, returns best match above threshold.
async function searchBestCoinId(
  tokenName: string,
  ticker?: string,
): Promise<string | null> {
  const seen    = new Set<string>();
  const queries = [ticker, tokenName].filter((q): q is string => !!q && !seen.has(q) && !!seen.add(q));
  const scores  = new Map<string, { coin: CgSearchCoin; score: number }>();

  for (const query of queries) {
    try {
      const res = await fetch(
        `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      if (!res.ok) continue;
      const data = await res.json() as { coins?: CgSearchCoin[] };
      const q = query.toLowerCase();

      for (const coin of (data.coins ?? []).slice(0, 15)) {
        const prev  = scores.get(coin.id)?.score ?? 0;
        let   score = prev;

        // Exact symbol match
        if (coin.symbol.toLowerCase() === q)    score += 40;
        // Exact name match (case-insensitive)
        if (coin.name.toLowerCase()   === q)    score += 40;
        // Name starts with query
        if (coin.name.toLowerCase().startsWith(q)) score += 15;
        // Market cap rank bonus (lower rank = more established token)
        const rank = coin.market_cap_rank;
        if   (rank !== null && rank <= 50)   score += 25;
        else if (rank !== null && rank <= 200)  score += 20;
        else if (rank !== null && rank <= 1000) score += 12;
        else if (rank !== null && rank <= 5000) score += 5;
        else                                    score -= 15; // no rank = likely micro/spam token

        if (score > prev) scores.set(coin.id, { coin, score });
      }
    } catch { /* ignore per-query errors */ }
  }

  if (scores.size === 0) return null;

  const best = Array.from(scores.values()).sort((a, b) => b.score - a.score)[0];
  // Require a meaningful signal — pure first-result fallback with no rank is rejected
  if (best.score < 20) {
    console.log(`[coin-data] No confident match (best score ${best.score} for "${best.coin.name}") — skipping`);
    return null;
  }

  console.log(`[coin-data] Matched "${best.coin.name}" (${best.coin.symbol}) rank #${best.coin.market_cap_rank ?? "unranked"} score=${best.score}`);
  return best.coin.id;
}

export async function fetchCoinFinancials(
  tokenName: string,
  ticker?: string,
): Promise<CoinFinancials | null> {
  const coinId = await searchBestCoinId(tokenName, ticker);

  if (!coinId) {
    console.log(`[coin-data] No CoinGecko match for "${ticker ?? tokenName}"`);
    return null;
  }

  console.log(`[coin-data] Found CoinGecko ID: ${coinId}`);

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true`,
      { signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = await res.json() as any;
    const md = d.market_data ?? {};

    const marketCapUsd: number | null = md.market_cap?.usd ?? null;

    // Count unique exchange IDs
    const exchangesListed: number | null = d.tickers
      ? new Set((d.tickers as { market: { identifier: string } }[]).map((t) => t.market.identifier)).size
      : null;

    const cd  = d.community_data  ?? {};
    const dev = d.developer_data  ?? {};

    // Extract GitHub repo URL from repos_url if available
    const githubUrl: string | null =
      (d.links?.repos_url?.github as string[] | undefined)?.filter(Boolean)?.[0] ?? null;

    return {
      id:                   coinId,
      name:                 d.name ?? tokenName,
      symbol:               (d.symbol ?? ticker ?? "").toUpperCase(),
      description:          (d.description?.en ?? "").slice(0, 600),
      price_usd:            md.current_price?.usd ?? null,
      market_cap_usd:       marketCapUsd,
      market_cap_rank:      d.market_cap_rank ?? null,
      volume_24h_usd:       md.total_volume?.usd ?? null,
      price_change_30d_pct: md.price_change_percentage_30d ?? null,
      circulating_supply:   md.circulating_supply ?? null,
      total_supply:         md.total_supply ?? null,
      max_supply:           md.max_supply ?? null,
      ath_usd:              md.ath?.usd ?? null,
      genesis_date:         d.genesis_date ?? null,
      homepage:             d.links?.homepage?.[0] ?? null,
      whitepaper_url:       d.links?.whitepaper ?? null,
      blockchain_explorer:  d.links?.blockchain_site?.filter(Boolean)?.[0] ?? null,
      github_url:           githubUrl,
      categories:           (d.categories ?? []).filter(Boolean).slice(0, 6),
      exchanges_listed:     exchangesListed,
      // Community
      reddit_subscribers:          cd.reddit_subscribers          ?? null,
      reddit_active_48h:           cd.reddit_accounts_active_48h  ?? null,
      telegram_channel_user_count: cd.telegram_channel_user_count ?? null,
      // Developer / GitHub
      github_stars:            dev.stars                    ?? null,
      github_forks:            dev.forks                    ?? null,
      github_total_issues:     dev.total_issues             ?? null,
      github_closed_issues:    dev.closed_issues            ?? null,
      github_commits_4_weeks:  dev.commit_count_4_weeks     ?? null,
      github_contributors:     dev.pull_request_contributors ?? null,
      is_significant_token: marketCapUsd !== null && marketCapUsd > 5_500_000_000,
    };
  } catch (err) {
    console.warn(`[coin-data] Fetch failed for ${coinId}:`, err);
    return null;
  }
}

export function formatFinancialsForPrompt(f: CoinFinancials): string {
  const fmt = (n: number | null, prefix = "", suffix = "") =>
    n !== null ? `${prefix}${n.toLocaleString("en-US")}${suffix}` : "N/A";
  const fmtM = (n: number | null) =>
    n !== null ? `$${(n / 1e6).toFixed(0)}M USD` : "N/A";

  return [
    "=== Market & Financial Data (CoinGecko) ===",
    `Token: ${f.name} (${f.symbol})`,
    `CoinGecko ID: ${f.id}`,
    f.description && `Description: ${f.description}`,
    "",
    "-- Tokenomics --",
    `Current Price: ${fmt(f.price_usd, "$")}`,
    `Market Cap: ${fmtM(f.market_cap_usd)}  |  Rank: #${f.market_cap_rank ?? "N/A"}`,
    `24h Volume: ${fmtM(f.volume_24h_usd)}`,
    `30-day Price Change: ${f.price_change_30d_pct !== null ? f.price_change_30d_pct.toFixed(1) + "%" : "N/A"}`,
    `All-Time High: ${fmt(f.ath_usd, "$")}`,
    `Circulating Supply: ${fmt(f.circulating_supply)}`,
    `Total Supply: ${fmt(f.total_supply)}`,
    `Max Supply: ${fmt(f.max_supply)}`,
    `Exchanges Listed On: ${f.exchanges_listed ?? "N/A"} exchanges`,
    "",
    "-- Community --",
    `Reddit Subscribers: ${fmt(f.reddit_subscribers)}  |  Active (48h): ${fmt(f.reddit_active_48h)}`,
    `Telegram Members: ${fmt(f.telegram_channel_user_count)}`,
    "",
    "-- Developer Activity (GitHub, last 4 weeks) --",
    f.github_url && `GitHub Repository: ${f.github_url}`,
    `Stars: ${fmt(f.github_stars)}  |  Forks: ${fmt(f.github_forks)}`,
    `Open Issues: ${fmt(f.github_total_issues)}  |  Closed Issues: ${fmt(f.github_closed_issues)}`,
    `Commits (last 4 weeks): ${fmt(f.github_commits_4_weeks)}`,
    "",
    "-- Links --",
    f.homepage            && `Official Website: ${f.homepage}`,
    f.whitepaper_url      && `Whitepaper URL: ${f.whitepaper_url}`,
    f.blockchain_explorer && `Blockchain Explorer: ${f.blockchain_explorer}`,
    f.genesis_date        && `Genesis / Launch Date: ${f.genesis_date}`,
    f.categories.length > 0 && `Categories: ${f.categories.join(", ")}`,
    "",
    `MiCA Significance (Art. 43 — market cap > €5 B): ${f.is_significant_token ? "YES — significant token assessment may apply" : "NO — below significance threshold"}`,
    "===========================================",
  ].filter(Boolean).join("\n");
}
