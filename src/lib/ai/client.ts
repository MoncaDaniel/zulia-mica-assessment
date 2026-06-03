import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Resolve the Anthropic API key.
 *
 * Problem: the shell may have ANTHROPIC_API_KEY="" (empty string) set as a
 * placeholder. Node.js / Next.js treats that as "the variable is set" and
 * does NOT fall back to the .env file value — the same bug we hit in the
 * FastAPI backend (fixed there with env_ignore_empty=True).
 *
 * Fix: if process.env gives an empty string, read .env directly.
 */
function resolveApiKey(): string {
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  // Fallback: parse .env file directly
  try {
    const envPath = resolve(process.cwd(), ".env");
    const contents = readFileSync(envPath, "utf-8");
    const match = contents.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
    if (match) {
      const val = match[1].trim().replace(/^["']|["']$/g, "");
      if (val) return val;
    }
  } catch { /* .env not found — will fail at API call time with a clear error */ }

  return "";
}

// Singleton — one client for the whole app, same pattern as prisma.ts
const globalForAI = globalThis as unknown as { anthropic?: Anthropic };

export const anthropic =
  globalForAI.anthropic ??
  new Anthropic({ apiKey: resolveApiKey() });

if (process.env.NODE_ENV !== "production") {
  globalForAI.anthropic = anthropic;
}

export const AI_MODEL = "claude-sonnet-4-6";
