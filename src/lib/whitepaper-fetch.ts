import dns from "dns/promises";
import net from "net";

const PDF_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const URL_FETCH_TIMEOUT_MS = 20_000;

export type WhitepaperFetchResult =
  | { ok: true; buffer: Buffer; filename: string }
  | { ok: false; error: string };

// ── SSRF guard ──────────────────────────────────────────────────────────────
// The whitepaper URL is now reachable by anonymous visitors, so a link
// pointing at internal infrastructure (cloud metadata endpoints, localhost,
// private ranges) must be refused before we ever fetch it.

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true; // this-host, private, loopback
    if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata 169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd")) return true; // link-local, ULA
    if (lower.startsWith("::ffff:")) return isBlockedIp(lower.slice(7)); // IPv4-mapped
    return false;
  }
  return true; // unparseable → refuse
}

async function assertPublicUrl(parsed: URL): Promise<string | null> {
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return "That URL points to an internal host.";
  }
  if (net.isIP(host)) {
    return isBlockedIp(host) ? "That URL points to a private or reserved address." : null;
  }
  try {
    const records = await dns.lookup(host, { all: true });
    if (records.length === 0) return "Could not resolve that host.";
    if (records.some((r) => isBlockedIp(r.address))) {
      return "That URL resolves to a private or reserved address.";
    }
  } catch {
    return "Could not resolve that host.";
  }
  return null;
}

/**
 * Fetch a whitepaper PDF from a user-provided URL exactly once, at creation
 * time, so the result can be stored and reused. Extraction never re-fetches
 * this URL. Moved out of the assessments route so the public flow can share
 * it — with the SSRF guard above added now that anonymous input reaches here.
 */
export async function fetchWhitepaperPdf(url: string): Promise<WhitepaperFetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "URL must start with http:// or https://" };
  }

  const blocked = await assertPublicUrl(parsed);
  if (blocked) return { ok: false, error: blocked };

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "error", // don't let a public URL 302 into an internal one
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(URL_FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not fetch that URL: ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, error: `That URL returned HTTP ${res.status}.` };
  }

  const contentType = res.headers.get("content-type") ?? "";
  const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10);
  if (contentLength > PDF_MAX_BYTES) {
    return { ok: false, error: `PDF too large (${(contentLength / 1_048_576).toFixed(1)} MB — max 20 MB).` };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > PDF_MAX_BYTES) {
    return { ok: false, error: `PDF too large (${(buffer.length / 1_048_576).toFixed(1)} MB — max 20 MB).` };
  }

  const looksLikePdf =
    contentType.includes("application/pdf") || buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (!looksLikePdf) {
    return {
      ok: false,
      error:
        `That URL didn't return a PDF (got "${contentType || "unknown content type"}"). ` +
        `It may be a landing page rather than a direct link — try the direct PDF link, ` +
        `or download it and upload the file instead.`,
    };
  }

  const rawName = parsed.pathname.split("/").filter(Boolean).pop() || "whitepaper.pdf";
  const filename = rawName.toLowerCase().endsWith(".pdf") ? rawName : `${rawName}.pdf`;
  return { ok: true, buffer, filename };
}

export { PDF_MAX_BYTES };
