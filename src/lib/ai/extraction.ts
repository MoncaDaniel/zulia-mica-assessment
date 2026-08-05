import { anthropic, AI_MODEL } from "./client";
import { SYSTEM_PROMPT } from "./prompts";
import { MICA_GROUPS, GROUP_STREAM_ORDER, MICA_GROUP_MAP } from "./mica-groups";
import { extractPdfContent } from "./pdf-extract";
import { scoreGroup, overallScore, complianceFlag } from "./scoring";
import type { MicaGroupData, MicaItemFinding, MicaAnalysisResult } from "./types";
export { scoreGroup, overallScore, complianceFlag } from "./scoring";

// ── Logging helpers ───────────────────────────────────────────────────────────
const SEP = "━".repeat(56);
const THIN = "─".repeat(56);

function groupSummary(data: MicaGroupData) {
  const items  = Object.values(data) as MicaItemFinding[];
  const found    = items.filter((i) => i.status === "found").length;
  const notFound = items.filter((i) => i.status === "not_found").length;
  const na       = items.filter((i) => i.status === "na").length;
  const empty    = items.filter((i) => i.status === "").length;
  return { found, notFound, na, empty, total: items.length };
}

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function fmtCost(inputTokens: number, outputTokens: number) {
  // Sonnet 4.6: $3/M input, $15/M output
  const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  return `~$${cost.toFixed(3)}`;
}

function fmtMs(ms: number) {
  return ms >= 60_000
    ? `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
    : `${(ms / 1000).toFixed(1)}s`;
}

// ── Per-item schema ───────────────────────────────────────────────────────────
const ITEM_SCHEMA = {
  type: "object",
  properties: {
    status:     { type: "string", enum: ["found", "not_found", "na", ""] },
    excerpt:    { type: "string", description: "Direct quote from the whitepaper (max 150 chars). Empty if status is not 'found'." },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoning:  { type: "string", description: "One sentence explaining why this status was assigned and what evidence (or lack of it) supports the decision." },
  },
  required: ["status", "excerpt", "confidence", "reasoning"],
} as const;

// ── Build extraction tool, scoped to a subset of MICA_GROUPS ──────────────────
// A single call covering all 12 groups (70 items) takes Claude ~70-80s to
// stream back, which exceeds Vercel's Hobby-tier 60s function ceiling. Instead
// we split the groups into small batches and run one tool-use call per batch
// concurrently -- each call has far less output to generate, so wall-clock
// time drops roughly proportionally to the number of batches, independent of
// the (unchanged) total work Claude is doing.
function buildExtractionTool(groupKeys: readonly string[]) {
  const groupProperties: Record<string, unknown> = {};

  for (const key of groupKeys) {
    const group = MICA_GROUP_MAP[key];
    const itemProperties: Record<string, unknown> = {};
    for (const item of group.items) {
      itemProperties[item.key] = ITEM_SCHEMA;
    }
    groupProperties[group.key] = {
      type: "object",
      required: group.items.map((i) => i.key),
      properties: itemProperties,
    };
  }

  return {
    name: "assess_mica_compliance",
    description:
      "Assess a crypto-asset whitepaper against a subset of MiCA mandatory disclosure requirements.",
    input_schema: {
      type: "object" as const,
      required: [...groupKeys],
      properties: groupProperties,
    },
  };
}

// Batch size chosen so 12 groups → 3 concurrent calls; stays generic if the
// group list ever changes.
const BATCH_SIZE = 4;

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── JSON object extractor ─────────────────────────────────────────────────────
function extractJsonObject(str: string, fromIdx: number): string | null {
  const start = str.indexOf("{", fromIdx);
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (esc)                 { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true;  continue; }
    if (c === '"')           { inStr = !inStr; continue; }
    if (inStr)               continue;
    if (c === "{")           depth++;
    if (c === "}" && --depth === 0) return str.slice(start, i + 1);
  }
  return null;
}

// ── PDF loader — kept for route compatibility ─────────────────────────────────
// Routes pass the buffer; extraction builds content internally via extractPdfContent.
export { extractPdfContent };

// ── Streaming callbacks ───────────────────────────────────────────────────────
export interface StreamCallbacks {
  onGroup:     (groupKey: string, data: MicaGroupData) => void | Promise<void>;
  onNarrative: (narrative: string) => void | Promise<void>;
  onDone:      (tokensUsed: number) => void | Promise<void>;
}


type UserContent = Array<
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
>;

interface BatchResult {
  raw:          Record<string, unknown>;
  inputTokens:  number;
  outputTokens: number;
}

// ── One batch call — a subset of groups, no narrative ──────────────────────────
async function runBatch(
  batchGroupKeys: string[],
  userContent: UserContent,
  callbacks: StreamCallbacks,
): Promise<BatchResult> {
  const tool = buildExtractionTool(batchGroupKeys);

  console.log(`[extraction] ┌ ${pad(batchGroupKeys[0], 20)} ${MICA_GROUP_MAP[batchGroupKeys[0]]?.label ?? ""}  [batch: ${batchGroupKeys.join(", ")}]`);

  const claudeStream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 6000,
    temperature: 0,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cache_control: { type: "ephemeral" } as any,
      },
    ],
    tools: [tool],
    tool_choice: { type: "tool", name: "assess_mica_compliance" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: [{ role: "user", content: userContent as any }],
  });

  // Detect group completion as Claude writes the JSON stream. A group is
  // complete when the next group's key appears. The batch's last group has
  // no such marker (nothing follows it in this call's schema) and is always
  // picked up by the post-finalMessage fallback below instead.
  let jsonBuffer = "";
  let emittedCount = 0;

  claudeStream.on("inputJson", (delta: string) => {
    jsonBuffer += delta;

    while (emittedCount < batchGroupKeys.length - 1) {
      const key     = batchGroupKeys[emittedCount];
      const nextKey = batchGroupKeys[emittedCount + 1];
      const marker  = `"${nextKey}"`;

      if (!jsonBuffer.includes(marker)) break;

      const keyPattern = `"${key}":`;
      const keyIdx     = jsonBuffer.indexOf(keyPattern);
      if (keyIdx !== -1) {
        const groupJson = extractJsonObject(jsonBuffer, keyIdx + keyPattern.length);
        if (groupJson) {
          try {
            const data = JSON.parse(groupJson) as MicaGroupData;
            const s = groupSummary(data);
            const allNA = s.found === 0 && s.notFound === 0;
            console.log(
              `[extraction] └ ${pad(key, 20)} ✓  ${s.found} found · ${s.notFound} not_found · ${s.na} n/a` +
              (s.empty ? ` · ${s.empty} unknown` : "") +
              (allNA ? "  (all N/A)" : ""),
            );
            console.log(`[extraction] ┌ ${pad(nextKey, 20)} ${MICA_GROUP_MAP[nextKey]?.label ?? ""}`);
            void Promise.resolve(callbacks.onGroup(key, data));
          } catch {
            console.warn(`[extraction] └ ${key}  ✗  parse error`);
          }
        }
      }
      emittedCount++;
    }
  });

  const response = await claudeStream.finalMessage();

  if (response.stop_reason === "max_tokens") {
    throw new Error(`Batch response truncated at max_tokens (${response.usage.output_tokens} output tokens).`);
  }

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block for a batch — unexpected response format.");
  }

  const raw = toolBlock.input as Record<string, unknown>;

  // Fallback: emit groups not caught during streaming (always includes at
  // least this batch's last group, by design).
  const fallbackGroups = batchGroupKeys.slice(emittedCount);
  for (const key of fallbackGroups) {
    const data = raw[key] as MicaGroupData | undefined;
    if (data) {
      const s = groupSummary(data);
      const allNA = s.found === 0 && s.notFound === 0;
      console.log(
        `[extraction] └ ${pad(key, 20)} ✓  ${s.found} found · ${s.notFound} not_found · ${s.na} n/a` +
        (s.empty ? ` · ${s.empty} unknown` : "") +
        (allNA ? "  (all N/A)" : "") + "  [fallback]",
      );
      await callbacks.onGroup(key, data);
    } else {
      console.warn(`[extraction] └ ${key}  ✗  no data in Claude response`);
    }
  }

  return { raw, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
}

// ── Narrative — small separate call over the already-collected findings ────────
// Kept out of the batch calls entirely: it needs the full picture (all 12
// groups) to write a coherent summary, so it can only run after every batch
// resolves. Making it its own tiny call (short prompt, no document, no tool
// schema covering 70 fields) keeps this step fast — a few seconds, not
// another 20-30s — since it's the one part of the pipeline that's inherently
// sequential rather than parallelizable.
async function generateNarrative(
  tokenName: string,
  groupMap: Partial<Record<string, MicaGroupData>>,
): Promise<{ narrative: string; inputTokens: number; outputTokens: number }> {
  const score = overallScore(groupMap);
  const flag  = complianceFlag(score);

  const findingsSummary = GROUP_STREAM_ORDER.map((key) => {
    const data = groupMap[key];
    if (!data) return null;
    const group = MICA_GROUP_MAP[key];
    const s = groupSummary(data);
    const gaps = Object.entries(data)
      .filter(([, f]) => f.status === "not_found")
      .map(([itemKey]) => group.items.find((i) => i.key === itemKey)?.label ?? itemKey);
    return `${group.label}: ${s.found}/${s.total} found` + (gaps.length ? ` — missing: ${gaps.join("; ")}` : "");
  }).filter(Boolean).join("\n");

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 700,
    temperature: 0,
    messages: [{
      role: "user",
      content:
        `Token project: ${tokenName}\n` +
        `Overall MiCA disclosure completeness: ${score !== null ? `${score}% (${flag})` : "N/A"}\n\n` +
        `Findings by group:\n${findingsSummary}\n\n` +
        `Write a 2-3 paragraph executive summary of this whitepaper's MiCA compliance posture: ` +
        `likely token type classification, key strengths, and main gaps. Plain prose, no headers or bullet points.`,
    }],
  });

  const textBlock  = response.content.find((b) => b.type === "text");
  const narrative  = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "No narrative generated.";

  return { narrative, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
}

// ── Core streaming extraction ─────────────────────────────────────────────────
// Runs the 12 groups as several smaller concurrent tool-use calls instead of
// one call covering everything -- a single call takes Claude ~70-80s to
// stream back, which exceeds Vercel's Hobby-tier 60s function ceiling.
// Splitting the same total work across BATCH_SIZE-sized concurrent calls
// cuts wall-clock time roughly proportionally to the batch count.
export async function runMicaExtractionStream(
  tokenName: string,
  pdfBuffer: Buffer,
  pdfName: string | undefined,
  enrichmentContext: string | undefined,   // pre-built: CoinGecko + GLEIF + scraped pages
  callbacks: StreamCallbacks,
): Promise<void> {
  // Extract text from PDF — dramatically reduces tokens vs raw binary
  const pdfContent = await extractPdfContent(pdfBuffer, pdfName);

  const enrichmentSummary = enrichmentContext
    ? ` + enrichment context (market data, legal registry, web pages)`
    : "";

  const introLines = [
    `Token project under review: ${tokenName}`,
    pdfContent.mode === "text"
      ? `Whitepaper: ${pdfContent.pages} pages, ~${pdfContent.tokenEstimate.toLocaleString()} tokens of extracted text${enrichmentSummary}`
      : `Whitepaper: image-based PDF (${(pdfContent.charCount / 1024 / 1024).toFixed(1)} MB — text not extractable)${enrichmentSummary}`,
    enrichmentContext ? `\n${enrichmentContext}` : "",
    "\nAnalyse the whitepaper against all MiCA compliance requirements.",
    enrichmentContext
      ? "Use the enrichment context above (market data, legal registry, scraped web pages) to supplement your analysis. Always cite the source URL when using external data."
      : "",
  ].filter(Boolean).join("\n");

  // Build user content: always put the intro text first, then the whitepaper.
  // Each batch call sends this same content independently (they run
  // concurrently, so there's no way to share one cached read across them) --
  // that means whitepaper input tokens are billed once per batch rather than
  // once total, a real cost tradeoff in exchange for the latency win.
  const userContent: UserContent = [{ type: "text", text: introLines }];

  if (pdfContent.mode === "text") {
    userContent.push({
      type: "text",
      text: `\n=== WHITEPAPER TEXT ===\n${pdfContent.text!}\n=== END WHITEPAPER ===`,
    });
  } else {
    userContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: pdfContent.base64!,
      },
    });
  }

  const batches = chunk(GROUP_STREAM_ORDER, BATCH_SIZE);

  // ── Content summary log ──────────────────────────────────────────────────
  const enrichmentTokens = enrichmentContext ? Math.round(enrichmentContext.length / 4) : 0;
  console.log(`[extraction] ${SEP}`);
  if (pdfContent.mode === "text") {
    console.log(`[extraction] Content   : text ${pdfContent.charCount.toLocaleString()} chars (≈${pdfContent.tokenEstimate.toLocaleString()} tokens)` +
      (enrichmentTokens ? ` + enrichment ≈${enrichmentTokens.toLocaleString()} tokens` : ""));
  } else {
    console.log(`[extraction] Content   : binary PDF ${(pdfContent.charCount / 1024 / 1024).toFixed(1)} MB` +
      (enrichmentTokens ? ` + enrichment ≈${enrichmentTokens.toLocaleString()} tokens` : ""));
  }
  console.log(`[extraction] Groups    : ${GROUP_STREAM_ORDER.length} groups · ${MICA_GROUPS.reduce((s, g) => s + g.items.length, 0)} items · ${batches.length} concurrent batches`);
  console.log(`[extraction] ${THIN}`);

  const startTime = Date.now();

  const batchResults = await Promise.all(batches.map((batch) => runBatch(batch, userContent, callbacks)));

  const raw: Record<string, unknown> = {};
  for (const result of batchResults) Object.assign(raw, result.raw);

  const batchInputTokens  = batchResults.reduce((s, r) => s + r.inputTokens, 0);
  const batchOutputTokens = batchResults.reduce((s, r) => s + r.outputTokens, 0);
  const extractionMs      = Date.now() - startTime;

  // ── Final summary ─────────────────────────────────────────────────────────
  const allGroups = GROUP_STREAM_ORDER.map((k) => raw[k] as MicaGroupData | undefined).filter(Boolean) as MicaGroupData[];
  const totFound    = allGroups.reduce((s, g) => s + groupSummary(g).found, 0);
  const totNotFound = allGroups.reduce((s, g) => s + groupSummary(g).notFound, 0);
  const totNA       = allGroups.reduce((s, g) => s + groupSummary(g).na, 0);
  const totEmpty    = allGroups.reduce((s, g) => s + groupSummary(g).empty, 0);
  const groupMap    = Object.fromEntries(GROUP_STREAM_ORDER.map((k) => [k, raw[k] as MicaGroupData | undefined]).filter(([, v]) => v)) as Partial<Record<string, MicaGroupData>>;
  const score       = overallScore(groupMap);
  const flag        = complianceFlag(score);

  console.log(`[extraction] ${SEP}`);
  console.log(`[extraction] Score     : ${score !== null ? `${score}% ${flag}` : "N/A"}  ·  ${totFound} found · ${totNotFound} not_found · ${totNA} n/a${totEmpty ? ` · ${totEmpty} unknown` : ""}`);
  console.log(`[extraction] Extraction: ${fmtMs(extractionMs)} across ${batches.length} concurrent calls · ${batchInputTokens.toLocaleString()} input + ${batchOutputTokens.toLocaleString()} output tokens`);

  const narrativeStart = Date.now();
  const { narrative, inputTokens: narrInputTokens, outputTokens: narrOutputTokens } = await generateNarrative(tokenName, groupMap);
  const narrativeMs = Date.now() - narrativeStart;

  const inp = batchInputTokens + narrInputTokens;
  const out = batchOutputTokens + narrOutputTokens;

  console.log(`[extraction] Narrative : ${fmtMs(narrativeMs)} · ${narrInputTokens.toLocaleString()} input + ${narrOutputTokens.toLocaleString()} output tokens`);
  console.log(`[extraction] Tokens    : ${inp.toLocaleString()} input (${fmtCost(inp, 0)}) + ${out.toLocaleString()} output (${fmtCost(0, out)}) = ${fmtCost(inp, out)} total`);
  console.log(`[extraction] Time      : ${fmtMs(Date.now() - startTime)} total`);
  console.log(`[extraction] ${SEP}`);

  await callbacks.onNarrative(narrative);
  await callbacks.onDone(inp + out);
}

// ── Blocking wrapper (for non-streaming use) ──────────────────────────────────
export async function runMicaExtraction(
  tokenName: string,
  pdfBuffer: Buffer,
  pdfName?: string,
  enrichmentContext?: string,
): Promise<MicaAnalysisResult> {
  const groups: Partial<Record<string, MicaGroupData>> = {};
  let narrative  = "No narrative generated.";
  let tokensUsed = 0;

  await runMicaExtractionStream(tokenName, pdfBuffer, pdfName, enrichmentContext, {
    onGroup:     (key, data) => { groups[key] = data; },
    onNarrative: (n)         => { narrative   = n; },
    onDone:      (t)         => { tokensUsed  = t; },
  });

  return { groups, narrative, tokensUsed };
}

// scoreGroup, overallScore, complianceFlag are re-exported from ./scoring
