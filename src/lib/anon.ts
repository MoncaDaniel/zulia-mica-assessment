import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Anonymous "one free assessment" gate.
 *
 * The public landing page lets any visitor run a single MiCA assessment with
 * no account. This module is the enforcement layer. It deliberately treats
 * IP as a *weak* signal (shared NAT, CGNAT, VPNs, IPv6 rotation all defeat
 * it) and leans primarily on a signed browser cookie, with the hashed-IP
 * table as a backstop against a plain cookie-clear, and a global daily cap
 * as the real budget guard.
 *
 * Raw IP addresses are never stored — only sha256(ip + IP_HASH_SALT),
 * truncated. AnonRun rows are purged after RETENTION_DAYS.
 */

const SALT =
  process.env.IP_HASH_SALT ||
  process.env.NEXTAUTH_SECRET ||
  "mica-anon-dev-salt-do-not-use-in-prod";

export const FREE_USED_COOKIE = "mica_free_used";
export const RUN_GRANT_COOKIE = "mica_run_grant";

const FREE_USED_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
const RUN_GRANT_COOKIE_MAX_AGE = 60 * 60; // 1 hour — just bridges the redirect

/** How long one hashed IP stays "spent" for the free run. */
const FREE_WINDOW_DAYS = numEnv("ANON_FREE_WINDOW_DAYS", 7);
/** Minimum gap between two runs from the same hashed IP. */
const MIN_INTERVAL_MS = numEnv("ANON_MIN_INTERVAL_SECONDS", 45) * 1000;
/** Total free anonymous assessments allowed per UTC day, across everyone. */
export const DAILY_CAP = numEnv("ANON_DAILY_CAP", 25);
/** AnonRun rows older than this are deleted opportunistically. */
const RETENTION_DAYS = numEnv("ANON_RETENTION_DAYS", 90);

function numEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ── IP extraction + hashing ──────────────────────────────────────────────────

type HeaderGet = (name: string) => string | null | undefined;

/**
 * Best-effort client IP. On Vercel the real client is the first entry of
 * x-forwarded-for (Vercel's proxy appends its own hop after it). For IPv6 we
 * collapse to the /64 prefix — a single subscriber is handed a whole /64, so
 * hashing the full address would let one household bypass or (worse) block
 * each other.
 */
export function clientIp(headerGet: HeaderGet, fallback?: string | null): string {
  const xff = headerGet("x-forwarded-for");
  const first =
    (xff ? xff.split(",")[0] : "").trim() ||
    (headerGet("x-real-ip") || "").trim() ||
    (fallback || "").trim();

  if (!first) return "0.0.0.0";

  // IPv6 → /64
  if (first.includes(":")) {
    const hextets = first.split(":");
    // Handle "::" compression conservatively: only trim when we clearly have
    // 8 groups. Otherwise hash the address as-is.
    if (hextets.length === 8) return hextets.slice(0, 4).join(":") + "::/64";
    return first;
  }
  return first;
}

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(`${ip}::${SALT}`).digest("hex").slice(0, 40);
}

/** ipHash straight from request headers. */
export function ipHashFrom(headerGet: HeaderGet, fallback?: string | null): string {
  return hashIp(clientIp(headerGet, fallback));
}

// ── Signed cookies ──────────────────────────────────────────────────────────

function sign(value: string): string {
  const mac = crypto.createHmac("sha256", SALT).update(value).digest("base64url");
  return `${value}.${mac}`;
}

function unsign(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 1) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SALT).update(value).digest("base64url");
  try {
    if (crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return value;
  } catch {
    /* length mismatch */
  }
  return null;
}

export function freeUsedCookie(): {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: "/";
    maxAge: number;
  };
} {
  return {
    name: FREE_USED_COOKIE,
    value: sign(`1.${Date.now()}`),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FREE_USED_COOKIE_MAX_AGE,
    },
  };
}

export function hasFreeUsedCookie(raw: string | undefined | null): boolean {
  return unsign(raw)?.startsWith("1.") ?? false;
}

export function grantCookie(grantToken: string) {
  return {
    name: RUN_GRANT_COOKIE,
    value: sign(grantToken),
    options: {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/" as const,
      maxAge: RUN_GRANT_COOKIE_MAX_AGE,
    },
  };
}

export function readGrantCookie(raw: string | undefined | null): string | null {
  return unsign(raw);
}

// ── Public system user ──────────────────────────────────────────────────────

let publicUserIdCache: string | null = null;

/** Id of the system account that owns every public/free assessment. */
export async function getPublicUserId(): Promise<string> {
  if (publicUserIdCache) return publicUserIdCache;
  const email = "public@mica-esma.tool";
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    publicUserIdCache = existing.id;
    return existing.id;
  }
  const created = await prisma.user.create({
    data: {
      email,
      name: "Public (free assessment)",
      // Unusable password — nothing ever authenticates as this account.
      password: crypto.randomBytes(24).toString("hex"),
      role: "ANALYST",
    },
    select: { id: true },
  });
  publicUserIdCache = created.id;
  return created.id;
}

// ── Grants (single-use bypass links) ────────────────────────────────────────

export function makeGrantToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export const GRANT_TTL_DAYS = numEnv("ANON_GRANT_TTL_DAYS", 30);

// ── Allowance check ─────────────────────────────────────────────────────────

export type AnonDenyCode = "COOKIE" | "IP" | "DAILY" | "THROTTLE";

export interface AnonAllowance {
  ok: boolean;
  code?: AnonDenyCode;
  reason?: string;
  /** Present when a valid single-use grant is being redeemed. */
  grantId?: string;
  ipHash: string;
}

interface AllowanceInput {
  ipHash: string;
  hasFreeCookie: boolean;
  grantToken?: string | null;
}

export async function checkAnonAllowance({
  ipHash,
  hasFreeCookie,
  grantToken,
}: AllowanceInput): Promise<AnonAllowance> {
  // 1. A valid single-use grant overrides every other check.
  if (grantToken) {
    const grant = await prisma.runGrant.findUnique({ where: { token: grantToken } });
    if (grant && !grant.usedAt && grant.expiresAt > new Date()) {
      return { ok: true, grantId: grant.id, ipHash };
    }
    // fall through to the normal checks if the grant is spent/expired/bogus
  }

  // 2. This browser has already spent its free run.
  if (hasFreeCookie) {
    return {
      ok: false,
      code: "COOKIE",
      reason: "You've already used your free assessment on this browser.",
      ipHash,
    };
  }

  // 3. Global budget guard.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const publicUserId = await getPublicUserId();
  const todayCount = await prisma.assessment.count({
    where: { createdById: publicUserId, createdAt: { gte: startOfDay } },
  });
  if (todayCount >= DAILY_CAP) {
    return {
      ok: false,
      code: "DAILY",
      reason: "The free assessment limit for today has been reached. Please try again tomorrow, or request one by email.",
      ipHash,
    };
  }

  // 4. Hashed-IP backstop (weak — see file header).
  const prior = await prisma.anonRun.findUnique({ where: { ipHash } });
  if (prior) {
    const sinceLast = Date.now() - prior.lastRunAt.getTime();
    if (sinceLast < MIN_INTERVAL_MS) {
      return {
        ok: false,
        code: "THROTTLE",
        reason: "That was quick — give it a minute before running another.",
        ipHash,
      };
    }
    if (sinceLast < FREE_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
      return {
        ok: false,
        code: "IP",
        reason: "This network has already used its free assessment. Request another by email.",
        ipHash,
      };
    }
  }

  return { ok: true, ipHash };
}

/** Record a completed free run and opportunistically purge old rows. */
export async function recordAnonRun(ipHash: string, assessmentId: string): Promise<void> {
  await prisma.anonRun.upsert({
    where: { ipHash },
    create: { ipHash, runs: 1, lastAssessmentId: assessmentId },
    update: { runs: { increment: 1 }, lastAssessmentId: assessmentId },
  });

  // Best-effort retention purge — never block the request on it.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  prisma.anonRun
    .deleteMany({ where: { lastRunAt: { lt: cutoff } } })
    .catch(() => {});
  prisma.runGrant
    .deleteMany({ where: { expiresAt: { lt: cutoff } } })
    .catch(() => {});
}

export async function consumeGrant(grantId: string, ipHash: string): Promise<void> {
  await prisma.runGrant
    .updateMany({
      where: { id: grantId, usedAt: null },
      data: { usedAt: new Date(), usedIpHash: ipHash },
    })
    .catch(() => {});
}
