/**
 * Validation script — run BEFORE building the full AI layer.
 * Tests: API key, URL fetch, HTML extraction, Claude tool_use output quality.
 * Usage: node scripts/validate-ai.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { load } from "cheerio";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env manually for this script
const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
const envContent = readFileSync(envPath, "utf-8");
const envVars = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);

const API_KEY = envVars["ANTHROPIC_API_KEY"];
if (!API_KEY || !API_KEY.startsWith("sk-ant-")) {
  console.error("❌ ANTHROPIC_API_KEY not found or invalid in .env");
  process.exit(1);
}

const client = new Anthropic({ apiKey: API_KEY });

// ── Test target: Ethereum (well-documented, public info) ─────────────────────
// Using the Ethereum website as a known, stable URL for validation
const TEST_URL = "https://ethereum.org/en/what-is-ethereum/";
const TEST_TOKEN = "Ethereum (ETH)";

// Minimal tool schema — test just 3 fields from different sections
// to validate output quality without a full expensive call
const VALIDATION_TOOL = {
  name: "validate_extraction",
  description: "Extract compliance signals from token project content",
  input_schema: {
    type: "object",
    required: ["fields", "summary"],
    properties: {
      fields: {
        type: "object",
        properties: {
          issuerIdentifiable: {
            type: "object",
            properties: {
              answer: { type: "string", enum: ["Yes", "No", "N/A", ""] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              citation: { type: "string" },
              justification: { type: "string" },
            },
            required: ["answer", "confidence", "citation", "justification"],
          },
          wpRiskDisclosure: {
            type: "object",
            properties: {
              answer: { type: "string", enum: ["Yes", "No", "N/A", ""] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              citation: { type: "string" },
              justification: { type: "string" },
            },
            required: ["answer", "confidence", "citation", "justification"],
          },
          smartContractAudit: {
            type: "object",
            properties: {
              answer: { type: "string", enum: ["Yes", "No", "N/A", ""] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              citation: { type: "string" },
              justification: { type: "string" },
            },
            required: ["answer", "confidence", "citation", "justification"],
          },
        },
        required: ["issuerIdentifiable", "wpRiskDisclosure", "smartContractAudit"],
      },
      summary: { type: "string" },
    },
  },
};

async function fetchPageText(url) {
  console.log(`\n📥 Fetching: ${url}`);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MiCA-Assessment-Bot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = load(html);
  $("script, style, nav, footer, header, [class*='menu'], [class*='nav']").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000);
  console.log(`   ✓ Fetched ${text.length} chars of clean text`);
  return text;
}

async function runValidation() {
  console.log("═══════════════════════════════════════════");
  console.log("  MiCA AI Extraction — Validation Script");
  console.log("═══════════════════════════════════════════");
  console.log(`Token: ${TEST_TOKEN}`);

  // Step 1: Fetch content
  let pageText;
  try {
    pageText = await fetchPageText(TEST_URL);
  } catch (e) {
    console.error(`❌ URL fetch failed: ${e.message}`);
    process.exit(1);
  }

  // Step 2: Claude extraction
  console.log("\n🤖 Sending to Claude for extraction...");
  const start = Date.now();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: `You are a MiCA (EU Regulation 2023/1114) compliance analyst.
Analyze token project content and answer compliance assessment fields.
Be precise. Only answer Yes/No/N/A if you find clear evidence in the provided content.
If the content does not contain enough information to answer, use "" (empty) with low confidence.
Citations must be brief direct quotes or page references from the content.`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [VALIDATION_TOOL],
    tool_choice: { type: "tool", name: "validate_extraction" },
    messages: [
      {
        role: "user",
        content: `Analyze this token project for MiCA compliance.\n\nToken: ${TEST_TOKEN}\nSource URL: ${TEST_URL}\n\nContent:\n${pageText}`,
      },
    ],
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`   ✓ Claude responded in ${elapsed}s`);
  console.log(`   Input tokens: ${response.usage.input_tokens} | Output: ${response.usage.output_tokens}`);

  // Step 3: Parse and validate output
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock) {
    console.error("❌ No tool_use block in response");
    process.exit(1);
  }

  const result = toolBlock.input;
  console.log("\n─── Extraction Results ───────────────────");
  for (const [field, data] of Object.entries(result.fields)) {
    const conf = (data.confidence * 100).toFixed(0);
    const confLabel = data.confidence > 0.7 ? "🟢" : data.confidence > 0.4 ? "🟡" : "🔴";
    console.log(`\n  ${field}:`);
    console.log(`    Answer:     ${data.answer || "(empty)"}`);
    console.log(`    Confidence: ${confLabel} ${conf}%`);
    console.log(`    Citation:   "${data.citation.slice(0, 80)}..."`);
    console.log(`    Reason:     ${data.justification.slice(0, 100)}`);
  }

  console.log("\n─── Summary ──────────────────────────────");
  console.log(result.summary);

  // Step 4: Structural validation
  console.log("\n─── Structural Checks ────────────────────");
  let passed = 0;
  let failed = 0;

  for (const [field, data] of Object.entries(result.fields)) {
    const checks = [
      ["answer is valid enum", ["Yes", "No", "N/A", ""].includes(data.answer)],
      ["confidence in range", data.confidence >= 0 && data.confidence <= 1],
      ["citation not empty", data.citation.length > 5],
      ["justification not empty", data.justification.length > 10],
    ];
    for (const [name, ok] of checks) {
      if (ok) { passed++; console.log(`  ✓ ${field}.${name}`); }
      else { failed++; console.error(`  ✗ ${field}.${name}`); }
    }
  }

  console.log(`\n  Result: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error("\n❌ Validation FAILED — fix schema before building");
    process.exit(1);
  }

  console.log("\n✅ Validation PASSED — safe to build full implementation");
  console.log("═══════════════════════════════════════════\n");
}

runValidation().catch((e) => {
  console.error("\n❌ Fatal error:", e.message);
  process.exit(1);
});
