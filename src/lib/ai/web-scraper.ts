/**
 * Targeted web scraper — fetches specific pages most likely to contain
 * MiCA-relevant information that whitepapers omit.
 *
 * For each URL, returns the extracted text AND the source URL so Claude
 * can cite it precisely.
 */

import { load, type CheerioAPI } from "cheerio";

export interface ScrapedPage {
  url:      string;
  label:    string;   // human-readable description of what this source is
  text:     string;
  chars:    number;
}

const USER_AGENT = "Mozilla/5.0 (compatible; MiCA-Assessment-Bot/1.0)";
const TIMEOUT_MS = 12_000;
const MAX_CHARS  = 30_000;

// ── Core fetch + clean ────────────────────────────────────────────────────────
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = load(html);
    $(
      "script, style, nav, footer, header, [class*='menu'], [class*='nav'], " +
      "[class*='cookie'], [class*='banner'], [class*='popup'], [class*='toast'], " +
      "[class*='modal'], [role='dialog'], iframe, noscript",
    ).remove();

    const text = $("body").text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CHARS);

    return text.length > 300 ? text : null;
  } catch {
    return null;
  }
}

// ── Try a list of candidate URLs, return first that works ─────────────────────
async function tryUrls(candidates: { url: string; label: string }[]): Promise<ScrapedPage | null> {
  for (const { url, label } of candidates) {
    const short = url.length > 65 ? url.slice(0, 62) + "…" : url;
    try {
      const text = await fetchPageText(url);
      if (text) {
        console.log(`[scrape] ✓ ${short}  ${text.length.toLocaleString()} chars  [${label}]`);
        return { url, label, text, chars: text.length };
      } else {
        console.log(`[scrape] ✗ ${short}  empty/JS-heavy  [${label}]`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 50) : String(err).slice(0, 50);
      console.log(`[scrape] ✗ ${short}  ${msg}  [${label}]`);
    }
  }
  return null;
}

// ── Build candidate URL list for a given base URL ────────────────────────────
function buildCandidates(baseUrl: string, label: string, paths: string[]): { url: string; label: string }[] {
  try {
    const base = new URL(baseUrl);
    const origin = base.origin;
    return paths.map(p => ({ url: origin + p, label }));
  } catch {
    return [];
  }
}

// ── Resolve best base URL to scrape ──────────────────────────────────────────
// CoinGecko sometimes returns app.* subdomain (the DApp) rather than the
// marketing/corporate site. Try stripping "app." prefix as a fallback.
async function resolveBaseUrl(homepageUrl: string): Promise<string> {
  // Quick reachability check
  const reachable = async (url: string): Promise<boolean> => {
    try {
      const r = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(6_000),
      });
      return r.ok;
    } catch { return false; }
  };

  try {
    const parsed   = new URL(homepageUrl);
    const hostname = parsed.hostname;

    // If hostname starts with "app.", try the root domain first
    if (hostname.startsWith("app.")) {
      const rootDomain = parsed.origin.replace("://app.", "://");
      if (await reachable(rootDomain)) {
        console.log(`[scrape] Resolved app.* → ${rootDomain}`);
        return rootDomain;
      }
    }
  } catch { /* ignore URL parse errors */ }

  return homepageUrl;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function scrapeProjectPages(
  homepageUrl: string | null,
  githubUrl:   string | null,
  tokenName:   string,
): Promise<ScrapedPage[]> {
  const results: ScrapedPage[] = [];

  console.log(`[scrape] ── Starting targeted scrape for "${tokenName}" ──`);

  // 1. Homepage — resolve app.* to root domain if needed
  if (homepageUrl) {
    const baseUrl = await resolveBaseUrl(homepageUrl);

    const page = await tryUrls([{ url: baseUrl, label: "homepage" }]);
    if (page) results.push(page);

    // 2. About / team / company page
    const aboutPage = await tryUrls(
      buildCandidates(baseUrl, "about/team page", [
        "/about", "/about-us", "/team", "/company", "/who-we-are",
        "/en/about", "/en/team",
      ])
    );
    if (aboutPage) results.push(aboutPage);

    // 3. Legal / terms / governance
    const legalPage = await tryUrls(
      buildCandidates(baseUrl, "legal/governance page", [
        "/legal", "/terms", "/governance", "/dao", "/foundation",
        "/en/governance", "/en/legal",
      ])
    );
    if (legalPage) results.push(legalPage);

    // 4. Docs / whitepaper
    const docsPage = await tryUrls([
      { url: baseUrl.replace(/\/$/, "") + "/docs", label: "docs" },
      { url: baseUrl.replace(/\/$/, "") + "/documentation", label: "docs" },
      { url: "https://docs." + new URL(baseUrl).hostname.replace(/^www\./, ""), label: "docs subdomain" },
    ]);
    if (docsPage) results.push(docsPage);
  }

  // 5. GitHub org page (README, description, pinned repos)
  if (githubUrl) {
    const ghPage = await tryUrls([{ url: githubUrl, label: "GitHub organisation" }]);
    if (ghPage) results.push(ghPage);

    // Also try the main repo README if URL is a repo (not just org)
    if (/github\.com\/[^/]+\/[^/]+/.test(githubUrl)) {
      const readmePage = await tryUrls([
        { url: githubUrl + "#readme", label: "GitHub README" },
      ]);
      if (readmePage) results.push(readmePage);
    }
  }

  const totalChars = results.reduce((s, r) => s + r.chars, 0);
  console.log(
    `[scrape] ── Done: ${results.length} page(s) · ${totalChars.toLocaleString()} chars total ──`,
  );

  return results;
}

// ── Format for Claude prompt ──────────────────────────────────────────────────
export function formatScrapedPagesForPrompt(pages: ScrapedPage[]): string {
  if (!pages.length) return "";

  const sections = pages.map(p =>
    `=== SOURCE: ${p.label.toUpperCase()} ===\n` +
    `URL: ${p.url}\n` +
    `${p.text}\n` +
    `=== END: ${p.label.toUpperCase()} ===`
  );

  return (
    "\n\n=== SUPPLEMENTARY WEB CONTENT ===\n" +
    "Each section below shows content scraped from a specific page.\n" +
    "When citing information from these sections, always include the URL shown above the section.\n\n" +
    sections.join("\n\n") +
    "\n=== END SUPPLEMENTARY WEB CONTENT ==="
  );
}

// ── Marketing Communications Audit (Art. 7 MiCA) ─────────────────────────────

export interface MarketingPageResult {
  url:      string;
  label:    string;
  scraped:  boolean;
  hasLabel: boolean;       // "marketing communication" label per Art. 7(1) found
  excerpts: string[];      // up to 3 matching passages
}

export interface SocialLink {
  platform: string;
  url:      string;
}

export interface MarketingCommsAudit {
  pagesChecked:              MarketingPageResult[];
  socialLinksFound:          SocialLink[];
  pagesScrapedCount:         number;
  pagesWithLabelCount:       number;
  pagesWithoutLabelCount:    number;
  unscrapableSocialPresence: boolean;
}

const DISCLAIMER_PATTERNS = [
  /marketing\s+communi/i,
  /this\s+is\s+a\s+marketing/i,
  /promotional\s+material/i,
  /\badvertisement\b/i,
  /not\s+(?:financial|investment)\s+advice/i,
  /comunicaci[oó]n\s+comercial/i,
  /comunicação\s+comercial/i,
  /marketingmitteilung/i,
  /communication\s+commerciale/i,
];

const SOCIAL_PATTERNS: Array<{ platform: string; re: RegExp }> = [
  { platform: "Twitter/X",   re: /https?:\/\/(?:twitter\.com|x\.com)\/[A-Za-z0-9_]{1,50}/i },
  { platform: "Telegram",    re: /https?:\/\/t\.me\/[A-Za-z0-9_]{1,50}/i },
  { platform: "Discord",     re: /https?:\/\/discord\.(?:gg|com\/invite)\/[A-Za-z0-9]+/i },
  { platform: "Medium",      re: /https?:\/\/medium\.com\/[@A-Za-z0-9_-]+/i },
  { platform: "LinkedIn",    re: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_-]+/i },
  { platform: "Reddit",      re: /https?:\/\/(?:www\.)?reddit\.com\/r\/[A-Za-z0-9_]+/i },
];

async function fetchRawHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractSocialLinks(html: string): SocialLink[] {
  const found: SocialLink[] = [];
  const seen  = new Set<string>();
  for (const { platform, re } of SOCIAL_PATTERNS) {
    const m = html.match(re);
    if (m && !seen.has(platform)) {
      seen.add(platform);
      found.push({ platform, url: m[0] });
    }
  }
  return found;
}

function checkDisclaimers(text: string): { hasLabel: boolean; excerpts: string[] } {
  const excerpts: string[] = [];
  for (const re of DISCLAIMER_PATTERNS) {
    const m = text.match(re);
    if (m && m.index !== undefined) {
      const start = Math.max(0, m.index - 60);
      const end   = Math.min(text.length, m.index + m[0].length + 60);
      excerpts.push("…" + text.slice(start, end).replace(/\s+/g, " ").trim() + "…");
      if (excerpts.length >= 3) break;
    }
  }
  return { hasLabel: excerpts.length > 0, excerpts };
}

export async function scrapeMarketingComms(
  homepageUrl: string | null,
  tokenName:   string,
): Promise<MarketingCommsAudit> {
  const results: MarketingPageResult[] = [];
  let socialLinks: SocialLink[] = [];

  console.log(`[mktg-audit] ── Marketing comms audit for "${tokenName}" ──`);

  if (!homepageUrl) {
    console.log(`[mktg-audit] No homepage URL — skipping`);
    return {
      pagesChecked: [],
      socialLinksFound: [],
      pagesScrapedCount: 0,
      pagesWithLabelCount: 0,
      pagesWithoutLabelCount: 0,
      unscrapableSocialPresence: false,
    };
  }

  let baseUrl: string;
  try {
    baseUrl = new URL(await resolveBaseUrl(homepageUrl)).origin;
  } catch {
    baseUrl = homepageUrl.replace(/\/$/, "");
  }

  // 1. Homepage — extract social links and check for disclaimers
  const homeHtml = await fetchRawHtml(baseUrl);
  if (homeHtml) {
    socialLinks = extractSocialLinks(homeHtml);
    const $ = load(homeHtml);
    $(
      "script, style, nav, [class*='menu'], [class*='nav'], " +
      "[class*='cookie'], [class*='banner'], [class*='popup'], iframe, noscript",
    ).remove();
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 15_000);
    const { hasLabel, excerpts } = checkDisclaimers(text);
    results.push({ url: baseUrl, label: "homepage", scraped: true, hasLabel, excerpts });
    console.log(`[mktg-audit] homepage: ${hasLabel ? "✓ label found" : "✗ no label"} · ${socialLinks.length} social link(s)`);
  }

  // 2. Blog / news / press / announcement pages
  const marketingPaths = [
    { path: "/blog",          label: "blog" },
    { path: "/news",          label: "news" },
    { path: "/press",         label: "press" },
    { path: "/media",         label: "media" },
    { path: "/updates",       label: "updates" },
    { path: "/articles",      label: "articles" },
    { path: "/announcements", label: "announcements" },
  ];

  for (const { path, label } of marketingPaths) {
    const url  = baseUrl + path;
    const html = await fetchRawHtml(url);
    if (!html) {
      results.push({ url, label, scraped: false, hasLabel: false, excerpts: [] });
      continue;
    }
    const $ = load(html);
    $(
      "script, style, nav, footer, header, [class*='menu'], [class*='nav'], " +
      "[class*='cookie'], [class*='banner'], [class*='popup'], iframe, noscript",
    ).remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    if (text.length < 200) {
      results.push({ url, label, scraped: false, hasLabel: false, excerpts: [] });
      continue;
    }
    const { hasLabel, excerpts } = checkDisclaimers(text.slice(0, 15_000));
    results.push({ url, label, scraped: true, hasLabel, excerpts });
    console.log(`[mktg-audit] ${label}: ${hasLabel ? "✓ label found" : "✗ no label"} (${text.length.toLocaleString()} chars)`);
  }

  // 3. Dedicated disclaimer / legal notice page (first reachable one)
  const legalPaths = ["/disclaimer", "/disclosures", "/legal-notice", "/marketing-disclaimer"];
  for (const path of legalPaths) {
    const url  = baseUrl + path;
    const html = await fetchRawHtml(url);
    if (!html) continue;
    const $ = load(html);
    const text = $("body").text().replace(/\s+/g, " ").trim();
    if (text.length < 200) continue;
    const { hasLabel, excerpts } = checkDisclaimers(text.slice(0, 10_000));
    results.push({ url, label: "disclaimer page", scraped: true, hasLabel, excerpts });
    console.log(`[mktg-audit] disclaimer page (${path}): ${hasLabel ? "✓ label found" : "✗ no label"}`);
    break;
  }

  const scraped      = results.filter((r) => r.scraped);
  const withLabel    = scraped.filter((r) => r.hasLabel);
  const withoutLabel = scraped.filter((r) => !r.hasLabel);

  console.log(
    `[mktg-audit] ── Done: ${scraped.length} page(s) scraped · ` +
    `${withLabel.length} with label · ${withoutLabel.length} without ──`,
  );

  return {
    pagesChecked:              results,
    socialLinksFound:          socialLinks,
    pagesScrapedCount:         scraped.length,
    pagesWithLabelCount:       withLabel.length,
    pagesWithoutLabelCount:    withoutLabel.length,
    unscrapableSocialPresence: socialLinks.length > 0,
  };
}

export function formatMarketingCommsForPrompt(audit: MarketingCommsAudit): string {
  if (audit.pagesScrapedCount === 0 && audit.socialLinksFound.length === 0) {
    return "";
  }

  const lines: string[] = [
    "=== MARKETING COMMUNICATIONS AUDIT (Art. 7 MiCA) ===",
    `Pages scraped: ${audit.pagesScrapedCount} · With Art.7 label: ${audit.pagesWithLabelCount} · Without label: ${audit.pagesWithoutLabelCount}`,
  ];

  for (const p of audit.pagesChecked) {
    if (!p.scraped) continue;
    lines.push(
      `\n[${p.hasLabel ? "LABEL FOUND" : "NO LABEL"}] ${p.label.toUpperCase()} — ${p.url}`,
    );
    if (p.excerpts.length > 0) {
      p.excerpts.forEach((e) => lines.push(`  "${e}"`));
    }
  }

  if (audit.socialLinksFound.length > 0) {
    lines.push(
      `\nSocial media presence detected (not scrapable — analyst must verify manually):`,
    );
    audit.socialLinksFound.forEach((s) => lines.push(`  • ${s.platform}: ${s.url}`));
  }

  const notScraped = audit.pagesChecked.filter((p) => !p.scraped);
  if (notScraped.length > 0) {
    lines.push(`\nPages not reachable (JS-heavy or 404):`);
    notScraped.slice(0, 5).forEach((p) => lines.push(`  • ${p.label}: ${p.url}`));
  }

  lines.push("=== END MARKETING COMMUNICATIONS AUDIT ===");
  return lines.join("\n");
}
