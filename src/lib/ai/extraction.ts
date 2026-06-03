import { load } from "cheerio";
import { anthropic, AI_MODEL } from "./client";
import { SYSTEM_PROMPT } from "./prompts";
import { AiAnalysisResult, AiSectionData } from "./types";

// ── Field suggestion shape (reused across all section tool schemas) ──────────
const FIELD_SCHEMA = {
  type: "object",
  properties: {
    answer:        { type: "string", enum: ["Yes", "No", "N/A", ""] },
    confidence:    { type: "number", minimum: 0, maximum: 1 },
    citation:      { type: "string", description: "Direct quote or section reference (max 100 chars)" },
    justification: { type: "string", description: "One-sentence explanation of the answer" },
  },
  required: ["answer", "confidence", "citation", "justification"],
} as const;

// ── Full 10-section MiCA tool schema ─────────────────────────────────────────
// Each section key matches the sectionKey used in the DB and scoring engine.
const MICA_EXTRACTION_TOOL = {
  name: "extract_mica_compliance",
  description:
    "Extract MiCA compliance signals from token project documentation and fill all assessment sections.",
  input_schema: {
    type: "object" as const,
    required: ["sections", "narrative"],
    properties: {
      narrative: {
        type: "string",
        description:
          "2-3 paragraph executive summary of the token's overall MiCA compliance posture, key strengths, and main gaps found.",
      },
      sections: {
        type: "object",
        required: [
          "s02_issuer_legal", "s03_project_description", "s04_tokenomics",
          "s05_team_advisors", "s06_whitepaper", "s07_community",
          "s08_aml", "s09_technical", "s10_mica_compliance",
        ],
        properties: {
          // ── Section 02: Issuer & Legal ──────────────────────────────────
          s02_issuer_legal: {
            type: "object",
            required: ["issuerIdentifiable", "issuerAuthorised", "sourceCodeDisclosed"],
            properties: {
              issuerIdentifiable:  FIELD_SCHEMA,
              issuerAuthorised:    FIELD_SCHEMA,
              sourceCodeDisclosed: FIELD_SCHEMA,
            },
          },

          // ── Section 03: Project Description ────────────────────────────
          s03_project_description: {
            type: "object",
            required: ["clearUseCase", "roadmapDisclosed"],
            properties: {
              clearUseCase:     FIELD_SCHEMA,
              roadmapDisclosed: FIELD_SCHEMA,
            },
          },

          // ── Section 04: Tokenomics ──────────────────────────────────────
          s04_tokenomics: {
            type: "object",
            required: [
              "vestingSchedule", "mintingBurning",
              "fundingHistoryDisclosed", "priceOracleModel",
            ],
            properties: {
              vestingSchedule:         FIELD_SCHEMA,
              mintingBurning:          FIELD_SCHEMA,
              fundingHistoryDisclosed: FIELD_SCHEMA,
              priceOracleModel:        FIELD_SCHEMA,
            },
          },

          // ── Section 05: Team & Advisors ─────────────────────────────────
          s05_team_advisors: {
            type: "object",
            required: [
              "teamIdentifiable", "teamExperience",
              "teamTrackRecord", "advisorsDisclosed",
            ],
            properties: {
              teamIdentifiable:  FIELD_SCHEMA,
              teamExperience:    FIELD_SCHEMA,
              teamTrackRecord:   FIELD_SCHEMA,
              advisorsDisclosed: FIELD_SCHEMA,
            },
          },

          // ── Section 06: Whitepaper Assessment (MiCA Art. 19) ───────────
          s06_whitepaper: {
            type: "object",
            required: [
              "wpIssuerIdentification", "wpTokenDescription", "wpTokenomicsDetails",
              "wpRightsObligations", "wpRiskDisclosure", "wpGovernance",
              "wpTechnologySecurity", "wpUseCase", "wpRegulatoryCompliance",
              "wpTeamAdvisors", "wpMarketAnalysis", "wpDisclaimerLegal", "wpRoadmap",
            ],
            properties: {
              wpIssuerIdentification: FIELD_SCHEMA,
              wpTokenDescription:     FIELD_SCHEMA,
              wpTokenomicsDetails:    FIELD_SCHEMA,
              wpRightsObligations:    FIELD_SCHEMA,
              wpRiskDisclosure:       FIELD_SCHEMA,
              wpGovernance:           FIELD_SCHEMA,
              wpTechnologySecurity:   FIELD_SCHEMA,
              wpUseCase:              FIELD_SCHEMA,
              wpRegulatoryCompliance: FIELD_SCHEMA,
              wpTeamAdvisors:         FIELD_SCHEMA,
              wpMarketAnalysis:       FIELD_SCHEMA,
              wpDisclaimerLegal:      FIELD_SCHEMA,
              wpRoadmap:              FIELD_SCHEMA,
            },
          },

          // ── Section 07: Community ───────────────────────────────────────
          s07_community: {
            type: "object",
            required: [
              "bugBountyProgram", "communityParticipation",
              "communityEvents", "developerRelations",
            ],
            properties: {
              bugBountyProgram:       FIELD_SCHEMA,
              communityParticipation: FIELD_SCHEMA,
              communityEvents:        FIELD_SCHEMA,
              developerRelations:     FIELD_SCHEMA,
            },
          },

          // ── Section 08: AML / Financial Crime ──────────────────────────
          s08_aml: {
            type: "object",
            required: [
              "inbuiltAnonymisation", "holdersIdentifiable",
              "blockchainAnalyticsTools", "transactionsTraceable",
              "listedOnExchanges", "illicitActivities",
              "passiveRevenueRights", "projectCommitment",
            ],
            properties: {
              inbuiltAnonymisation:   FIELD_SCHEMA,
              holdersIdentifiable:    FIELD_SCHEMA,
              blockchainAnalyticsTools: FIELD_SCHEMA,
              transactionsTraceable:  FIELD_SCHEMA,
              listedOnExchanges:      FIELD_SCHEMA,
              illicitActivities:      FIELD_SCHEMA,
              passiveRevenueRights:   FIELD_SCHEMA,
              projectCommitment:      FIELD_SCHEMA,
            },
          },

          // ── Section 09: Technical ───────────────────────────────────────
          s09_technical: {
            type: "object",
            required: [
              "securityIncidents", "githubReviewed",
              "vulnerabilitiesManaged", "euIntegration", "smartContractAudit",
            ],
            properties: {
              securityIncidents:      FIELD_SCHEMA,
              githubReviewed:         FIELD_SCHEMA,
              vulnerabilitiesManaged: FIELD_SCHEMA,
              euIntegration:          FIELD_SCHEMA,
              smartContractAudit:     FIELD_SCHEMA,
            },
          },

          // ── Section 10: MiCA Compliance ─────────────────────────────────
          s10_mica_compliance: {
            type: "object",
            required: [
              "reservesVerified", "executionFrameworkAligned",
              "marketAbuseMonitoring", "transparencyPublished",
              "significantTokenAssessment",
            ],
            properties: {
              reservesVerified:             FIELD_SCHEMA,
              executionFrameworkAligned:    FIELD_SCHEMA,
              marketAbuseMonitoring:        FIELD_SCHEMA,
              transparencyPublished:        FIELD_SCHEMA,
              significantTokenAssessment:   FIELD_SCHEMA,
            },
          },
        },
      },
    },
  },
};

// ── URL fetching ──────────────────────────────────────────────────────────────
// Returns { text, isPdf } — caller decides how to pass it to Claude.
// Limits HTML to 15 000 chars to stay well under context limits.
// Multiple URLs are fetched and concatenated (section-separated).
// 5 MB cap for PDFs — larger files crash the route and hit Anthropic limits
const PDF_MAX_BYTES = 5 * 1024 * 1024;

async function fetchUrl(
  url: string,
): Promise<{ text: string; isPdf: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MiCA-Assessment-Bot/1.0; +https://zulianetworks.com)",
      },
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      return { text: "", isPdf: false, error: `HTTP ${res.status}` };
    }

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/pdf")) {
      // Check file size before downloading — reject oversized PDFs
      const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10);
      if (contentLength > PDF_MAX_BYTES) {
        const mb = (contentLength / 1_048_576).toFixed(1);
        return {
          text: "",
          isPdf: false,
          error: `PDF too large (${mb} MB — max 5 MB). Use the project website or a text-based whitepaper URL instead.`,
        };
      }

      // Download and encode as base64 for Claude document block
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > PDF_MAX_BYTES) {
        return {
          text: "",
          isPdf: false,
          error: `PDF too large after download (${(buffer.byteLength / 1_048_576).toFixed(1)} MB). Use the project website URL instead.`,
        };
      }
      const base64 = Buffer.from(buffer).toString("base64");
      return { text: base64, isPdf: true };
    }

    const html = await res.text();
    const $ = load(html);

    // Strip boilerplate
    $(
      "script, style, nav, footer, header, " +
      "[class*='menu'], [class*='nav'], [class*='cookie'], " +
      "[class*='banner'], [class*='popup'], iframe",
    ).remove();

    const text = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15_000);

    return { text, isPdf: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: "", isPdf: false, error: msg };
  }
}

// ── Core extraction function ──────────────────────────────────────────────────
// Called by the API route. sourceUrls is the array of URLs the analyst submitted.
export async function runMicaExtraction(
  tokenName: string,
  sourceUrls: string[],
): Promise<AiAnalysisResult> {
  if (sourceUrls.length === 0) {
    throw new Error("At least one source URL is required for AI analysis");
  }

  // 1. Fetch all URLs in parallel
  console.log(`[extraction] Fetching ${sourceUrls.length} URLs...`);
  const fetched = await Promise.all(
    sourceUrls.map(async (url) => ({ url, ...(await fetchUrl(url)) })),
  );
  fetched.forEach(f => {
    if (f.error) console.warn(`[extraction] ${f.url} → ERROR: ${f.error}`);
    else console.log(`[extraction] ${f.url} → ${f.isPdf ? "PDF" : `${f.text.length} chars`}`);
  });

  // 2. Build user message content blocks
  // HTML pages are combined as a single text block.
  // PDFs are passed as document blocks (Claude native PDF support).
  const userContentBlocks: Array<
    | { type: "text"; text: string }
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  > = [];

  const htmlParts: string[] = [
    `Token project under review: ${tokenName}`,
    `Source URLs submitted: ${sourceUrls.join(", ")}`,
    "",
  ];

  for (const item of fetched) {
    if (item.error) {
      htmlParts.push(`[URL FETCH ERROR — ${item.url}]: ${item.error}`);
    } else if (item.isPdf) {
      // Text summary placeholder + actual PDF block
      htmlParts.push(`[PDF document loaded from ${item.url}]`);
      userContentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: item.text,
        },
      });
    } else {
      htmlParts.push(
        `\n=== Content from: ${item.url} ===\n${item.text}\n`,
      );
    }
  }

  // Text block always goes first (context + all HTML content)
  userContentBlocks.unshift({
    type: "text",
    text: htmlParts.join("\n"),
  });

  // 3. Call Claude with tool_use — streaming keeps the TCP connection alive
  // in WSL2/dev environments where long idle connections get dropped.
  const totalChars = htmlParts.join("").length;
  console.log(`[extraction] Sending to Claude (streaming) — ~${totalChars} chars of content`);
  const stream = anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: 8192,   // 48 fields × ~100 tokens each + narrative ≈ 6000 tokens needed
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cache_control: { type: "ephemeral" } as any,
      },
    ],
    tools: [MICA_EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "extract_mica_compliance" },
    messages: [
      {
        role: "user",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: userContentBlocks as any,
      },
    ],
  });

  // Log progress so we can see tokens arriving
  let outputTokensSeen = 0;
  stream.on("text", () => { outputTokensSeen++; });

  const response = await stream.finalMessage();

  // 4. Parse tool_use result
  console.log(`[extraction] Claude responded — input: ${response.usage.input_tokens} tokens, output: ${response.usage.output_tokens} tokens (streamed ${outputTokensSeen} chunks), stop: ${response.stop_reason}`);
  if (response.stop_reason === "max_tokens") {
    throw new Error(`Response was truncated (max_tokens reached). Output tokens: ${response.usage.output_tokens}. The model hit the limit before completing all fields.`);
  }
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block — unexpected response format");
  }

  const raw = toolBlock.input as {
    narrative?: string;
    sections?: Record<string, Record<string, unknown>> | null;
  };

  // 5. Reshape to AiAnalysisResult — guard against null/undefined from Claude
  const sections: Partial<Record<string, AiSectionData>> = {};
  if (raw.sections && typeof raw.sections === "object") {
    for (const [sectionKey, fields] of Object.entries(raw.sections)) {
      if (fields && typeof fields === "object") {
        sections[sectionKey] = fields as AiSectionData;
      }
    }
  }

  if (Object.keys(sections).length === 0) {
    throw new Error(
      "Claude returned no section data — the source content may be too thin. " +
      "Try adding more URLs (website, CoinMarketCap, GitHub README).",
    );
  }

  return {
    sections,
    narrative: raw.narrative ?? "No narrative generated.",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}
