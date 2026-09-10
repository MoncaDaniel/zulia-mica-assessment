import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Whitepaper | MiCA ESMA Assessment Tool",
  description:
    "Architecture, assessment model, AI pipeline, and engineering history of the MiCA ESMA Assessment Tool.",
};

const h2 = "text-base font-semibold text-white mt-10 mb-2";
const h3 = "text-sm font-semibold text-slate-200 mt-5 mb-1";
const li = "ml-4 list-disc marker:text-slate-600";

export default function WhitepaperPage() {
  return (
    <>
      <h1 className="mb-2 font-display text-2xl font-bold text-white">Technical Whitepaper</h1>
      <p className="mb-1 text-sm text-slate-400">MiCA ESMA Assessment Tool</p>
      <p className="mb-8 text-xs text-slate-500">
        Engineering &amp; product specification · Author: Daniel Moncada · Last updated: 10 September 2026
      </p>

      <section>
        <p className="italic text-slate-400">
          This is an engineering document about the software, not a crypto-asset whitepaper and not a
          MiCA disclosure. It describes how the MiCA ESMA Assessment Tool is built, the compliance
          model it applies, the AI pipeline behind it, and the concrete problems encountered during
          development and how they were resolved.
        </p>
      </section>

      <section>
        <h2 className={h2}>Contents</h2>
        <ol className="ml-4 list-decimal space-y-1 marker:text-slate-600">
          <li>Overview</li>
          <li>System architecture</li>
          <li>The MiCA assessment model</li>
          <li>The AI extraction pipeline</li>
          <li>The public free-assessment flow</li>
          <li>Report generation</li>
          <li>Engineering problems encountered and how they were resolved</li>
          <li>Known limitations and non-goals</li>
          <li>Development history</li>
          <li>Contact</li>
        </ol>
      </section>

      {/* 1 */}
      <section>
        <h2 className={h2}>1. Overview</h2>
        <p>
          The MiCA ESMA Assessment Tool takes a crypto-asset whitepaper (PDF upload or direct URL) and
          evaluates it against the mandatory disclosure requirements of Regulation (EU) 2023/1114
          (&ldquo;MiCA&rdquo;), primarily Article 6 and Annex I, together with selected Level 2 / Level
          3 technical standards for asset-referenced and e-money tokens. It returns a per-requirement
          finding set, a weighted completeness score, a compliance flag, an executive narrative, a
          market-data snapshot for context, and a downloadable PDF report that quotes the whitepaper
          passages behind each finding.
        </p>
        <p className="mt-2">
          It exists as a portfolio demonstration of applied regulatory tooling: a public one-shot free
          assessment for visitors, and an internal analyst / reviewer workflow (draft → submit →
          approve) behind authentication, with an opt-in public registry of approved results.
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2 className={h2}>2. System architecture</h2>
        <ul className="space-y-1">
          <li className={li}>
            <span className="text-slate-200">Framework:</span> Next.js 14 (App Router), React 18,
            TypeScript, Tailwind CSS. Rendered and deployed as serverless functions.
          </li>
          <li className={li}>
            <span className="text-slate-200">Data:</span> PostgreSQL via Prisma ORM. Whitepaper PDF
            bytes are stored in the database (a dedicated <code>AssessmentPdf</code> row) rather than
            on disk, so no route that JSON-serialises an assessment can leak the raw file.
          </li>
          <li className={li}>
            <span className="text-slate-200">Auth:</span> NextAuth with a credentials provider and JWT
            sessions; middleware gates the analyst area. The public flow uses no account.
          </li>
          <li className={li}>
            <span className="text-slate-200">AI:</span> Anthropic&rsquo;s Claude via the official SDK,
            using tool-use (structured output) for extraction and a short free-text call for the
            narrative.
          </li>
          <li className={li}>
            <span className="text-slate-200">Enrichment:</span> CoinGecko (market and developer data),
            the GLEIF LEI registry (legal-entity verification), and a targeted scrape of the
            project&rsquo;s own homepage / docs / GitHub / marketing pages.
          </li>
          <li className={li}>
            <span className="text-slate-200">Reports:</span> <code>@react-pdf/renderer</code>,
            rendered on the server to a byte stream.
          </li>
          <li className={li}>
            <span className="text-slate-200">Streaming:</span> analysis is delivered to the browser as
            Server-Sent Events so findings appear group-by-group as the model produces them.
          </li>
        </ul>
      </section>

      {/* 3 */}
      <section>
        <h2 className={h2}>3. The MiCA assessment model</h2>
        <h3 className={h3}>3.1 Thirteen requirement groups</h3>
        <p>
          Annex I and Article 6 are decomposed into 13 groups covering roughly 75 individual
          disclosure items, each mapped to its specific article or Annex paragraph:
        </p>
        <ul className="mt-2 space-y-1">
          <li className={li}>Offeror / person seeking admission to trading</li>
          <li className={li}>Issuer (where different from the offeror)</li>
          <li className={li}>Description of the crypto-asset project</li>
          <li className={li}>Terms of the offer to the public / admission to trading</li>
          <li className={li}>Rights and obligations attached to the crypto-asset</li>
          <li className={li}>Underlying technology</li>
          <li className={li}>Risk factors</li>
          <li className={li}>Principal adverse sustainability impacts</li>
          <li className={li}>Reserve of assets / backing (ART and EMT)</li>
          <li className={li}>ART prudential &amp; recovery requirements (ART only)</li>
          <li className={li}>Format requirements (mandatory disclaimer, table of contents, plain language, no future-value claims)</li>
          <li className={li}>Prohibited content (misleading statements, price forecasts, marketing consistency)</li>
          <li className={li}>Procedural obligations (NCA notification, website publication, classification note)</li>
        </ul>

        <h3 className={h3}>3.2 Per-item findings</h3>
        <p>
          For every item the model returns a status —{" "}
          <code>found</code>, <code>not_found</code>, <code>na</code>, or <code>&quot;&quot;</code>{" "}
          (insufficient data) — a verbatim quote (or the closest related language, when nothing
          satisfies the requirement), a confidence value reflecting evidence clarity (not likelihood
          of compliance), and a one- or two-sentence rationale. &ldquo;Found&rdquo; requires a passage
          that can be directly quoted; implied, aspirational, or marketing language does not qualify.
        </p>

        <h3 className={h3}>3.3 Scoring</h3>
        <p>
          Each group&rsquo;s score is the fraction of its <em>scoreable</em> items (found + not_found)
          that are found; items marked N/A or insufficient are excluded from the denominator. The
          overall score is a weighted average across the groups that produced a score, re-normalised
          by the weights actually present. Weights are fixed and sum to 1.0 — risk factors (0.14),
          rights and obligations (0.11), project description and technology (0.10 each) carry the most.
          Thresholds: <span className="text-green-400">≥ 75% PASS</span>,{" "}
          <span className="text-amber-400">50–74% REVIEW</span>,{" "}
          <span className="text-red-400">&lt; 50% FAIL</span>.
        </p>

        <h3 className={h3}>3.4 The no-issuer exemption</h3>
        <p>
          MiCA&rsquo;s Title II whitepaper obligations legally require an issuer or offeror to exist.
          A crypto-asset with no identifiable issuer — tokens created automatically as
          mining/staking/validation rewards, with no pre-mine, treasury, or controlling person
          (Bitcoin being the canonical case) — is outside the entire regime under Article 4(3) and
          Recital 22. The pipeline makes a single document-level determination first: if no legal
          entity or natural person appears anywhere as having created or controlling issuance, every
          item in every group is marked N/A, the assessment is flagged{" "}
          <span className="text-sky-400">EXEMPT</span>, and no score is computed. This is surfaced
          explicitly rather than letting the score silently go blank.
        </p>

        <h3 className={h3}>3.5 ART / EMT handling</h3>
        <p>
          The reserve and prudential groups only apply to asset-referenced and e-money tokens. The
          model distinguishes a single-fiat EMT (Article 48/49/50 — redemption at par, no interest)
          from a basket ART (Article 19, 35–47, including the stabilisation mechanism and own-funds,
          recovery, and redemption plans governed by the relevant EBA technical standards and
          guidelines), and marks the inapplicable set N/A accordingly. A low score on these groups is
          a statement about the document, not a ruling on the token&rsquo;s live market status —
          pre-existing tokens may fall under the Article 143 transitional regime, and listing
          decisions are each venue&rsquo;s own call.
        </p>
      </section>

      {/* 4 */}
      <section>
        <h2 className={h2}>4. The AI extraction pipeline</h2>
        <h3 className={h3}>4.1 Stages</h3>
        <ol className="ml-4 list-decimal space-y-1 marker:text-slate-600">
          <li>Fetch enrichment in parallel: CoinGecko market data and GLEIF legal-entity matches.</li>
          <li>Scrape the project&rsquo;s own web pages and run a marketing-communications audit for Article 7.</li>
          <li>Extract text from the PDF (falling back to sending the binary document when the PDF is image-only).</li>
          <li>Run the compliance extraction against Claude, then a separate short call for the executive narrative.</li>
        </ol>

        <h3 className={h3}>4.2 Batched, concurrent tool-use</h3>
        <p>
          A single tool-use call covering all 75 items takes the model roughly 70–90 seconds to
          stream back — over the serverless function ceiling on the deployment tier. The 13 groups are
          therefore split into four batches of up to four groups and run as concurrent tool-use calls.
          Each call has far less to generate, so wall-clock time drops roughly in proportion to the
          batch count. The tradeoff is cost: the whitepaper text is sent with every batch, so its
          input tokens are billed per batch rather than once. A representative run is on the order of
          75k input + 12k output tokens (~US$0.40) and about 90 seconds end to end.
        </p>

        <h3 className={h3}>4.3 Streaming and persistence</h3>
        <p>
          As each batch streams, group objects are parsed out of the partial JSON and emitted to the
          browser and persisted the moment they complete, so a slow or interrupted later batch never
          loses earlier work. The final status, score, flag, and narrative are written{" "}
          <em>before</em> the response stream is closed — a serverless function can be frozen or torn
          down the instant its response ends, so a fire-and-forget write after that point has no
          guarantee of completing (see §7).
        </p>

        <h3 className={h3}>4.4 Deterministic exempt narrative</h3>
        <p>
          For a no-issuer asset the legal conclusion is identical regardless of which asset it is, so
          the narrative is a fixed template rather than a model call — no risk of the model drifting
          into &ldquo;non-compliant&rdquo; framing for something that was never in scope, and zero
          extra tokens.
        </p>
      </section>

      {/* 5 */}
      <section>
        <h2 className={h2}>5. The public free-assessment flow</h2>
        <p>
          Any visitor can run one assessment with no account. A second run requires an emailed
          request, after which an administrator issues a single-use link. The gate is layered because
          IP address alone is a weak signal — shared NAT and CGNAT over-block, while VPNs and IPv6
          rotation under-block:
        </p>
        <ul className="mt-2 space-y-1">
          <li className={li}>
            <span className="text-slate-200">Signed cookie (primary):</span> an{" "}
            <code>httpOnly</code>, HMAC-signed marker set once a run is created.
          </li>
          <li className={li}>
            <span className="text-slate-200">Hashed-IP backstop:</span> a salted SHA-256 of the client
            IP (IPv6 reduced to its /64 prefix), stored with a short window and purged after a
            retention period. Raw IP addresses are never stored.
          </li>
          <li className={li}>
            <span className="text-slate-200">Global daily cap:</span> a fixed ceiling on free runs per
            day across all visitors — the real budget guard.
          </li>
          <li className={li}>
            <span className="text-slate-200">Short throttle:</span> a minimum interval between two runs
            from the same hashed IP.
          </li>
          <li className={li}>
            <span className="text-slate-200">Single-use grant links:</span> an unguessable token,
            issued against an email request, that bypasses the gate exactly once and is marked used
            when the assessment is actually created (so a mis-click does not burn it).
          </li>
        </ul>
        <p className="mt-2">
          Because the URL-fetch path is now reachable by anonymous input, it refuses non-HTTP(S)
          schemes, private / loopback / link-local / carrier-grade-NAT address ranges and cloud
          metadata endpoints (checked after DNS resolution), and disables redirects so a public URL
          cannot bounce into an internal one. Repeat email requests from the same address or hashed IP
          within a day are de-duplicated rather than piling up.
        </p>
      </section>

      {/* 6 */}
      <section>
        <h2 className={h2}>6. Report generation</h2>
        <p>
          The PDF is rendered server-side: a cover, an executive summary with the weighted score
          breakdown and a tokenomics / market-data table, one page per requirement group with the
          quoted evidence beneath each item, and a conclusion with flag-specific recommended actions.
          A <code>publicMode</code> flag switches the framing for the free flow — it drops the
          &ldquo;confidential / internal&rdquo; language, adds an author and contact line, and carries
          the standing disclaimer that this is automated analysis and not a determination by any
          competent authority.
        </p>
      </section>

      {/* 7 */}
      <section>
        <h2 className={h2}>7. Engineering problems encountered and how they were resolved</h2>

        <h3 className={h3}>7.1 Analysis completing without saving</h3>
        <p>
          Final database writes were fire-and-forget after the SSE stream closed. On a serverless
          platform the function can be frozen or killed the moment its response ends, so those writes
          often never landed — the client saw &ldquo;done&rdquo; while the record stayed{" "}
          <code>PENDING</code> forever. Fixed by awaiting the final writes before closing the stream.
        </p>

        <h3 className={h3}>7.2 One large model call exceeded the function time limit</h3>
        <p>
          A single tool-use call over all 75 items ran 70–90s against a 60s ceiling. Split into four
          concurrent batched calls of ≤4 groups; wall-clock time dropped roughly 4×, accepting that
          the whitepaper input is now billed per batch.
        </p>

        <h3 className={h3}>7.3 Batched streaming silently dropped groups</h3>
        <p>
          Group 13 was missing from every report, and Group 1 intermittently. The streaming parser
          detected a group boundary by the next group&rsquo;s key appearing in the buffer and advanced
          a cursor — but the model does not always emit groups in batch order, so a group written out
          of sequence had its cursor skipped past it, and the fallback (which only re-emitted the tail
          of the batch from the cursor position) could not recover it. Fixed by tracking emitted keys
          in a set and having the post-response fallback re-emit <em>any</em> group in the batch that
          was not already handed off.
        </p>

        <h3 className={h3}>7.4 The submit action nulled the AI score</h3>
        <p>
          Submitting an assessment for review re-ran a defunct section-based scorer that overwrote the
          correct AI-computed score and flag with null. The submit endpoint is now a pure status
          transition and touches no scoring.
        </p>

        <h3 className={h3}>7.5 No path from &ldquo;submitted&rdquo; to &ldquo;approved&rdquo;</h3>
        <p>
          The approve/reject panel existed but was never rendered anywhere, and the submit button
          lived in dead layout code, so a submitted assessment could never be approved and therefore
          never reach the public registry. Both were wired into the live assessment page, shown only
          to the roles the API already checked for.
        </p>

        <h3 className={h3}>7.6 &ldquo;12 / 10&rdquo; progress readout</h3>
        <p>
          The dashboard progress bar used a denominator hardcoded to 10 from an earlier ten-section
          wizard; with 13 groups it produced readouts like &ldquo;12 / 10&rdquo;. It now derives the
          denominator from the group list.
        </p>

        <h3 className={h3}>7.7 No-issuer assets scored as failures</h3>
        <p>
          Decentralised assets with no issuer (e.g. Bitcoin) were scored as non-compliant for omitting
          issuer disclosures they were never obliged to make. Introduced the Article 4(3) / Recital 22
          cascade: a single document-level determination that, when no issuer is identifiable, marks
          the whole checklist N/A and flags the assessment EXEMPT with no score.
        </p>

        <h3 className={h3}>7.8 Empty environment variable shadowing the real key</h3>
        <p>
          An <code>ANTHROPIC_API_KEY=&quot;&quot;</code> left in the shell counts as &ldquo;set&rdquo;
          to Node, so the framework never fell back to the <code>.env</code> value and every model
          call failed. The key resolver now treats an empty string as unset and parses{" "}
          <code>.env</code> directly as a fallback — the same failure mode, and fix, as an earlier
          Python backend.
        </p>

        <h3 className={h3}>7.9 Evidence quotes were too short to be persuasive</h3>
        <p>
          Excerpts were capped at 150 characters — often a fragment. The cap was raised to around 600
          characters with a request for a section or page locator, and <code>not_found</code> items
          now cite the closest language actually present so a reader can see what is there and why it
          falls short. The per-batch output budget was raised in step so longer quotes do not truncate
          the response (a truncated tool-use response is treated as a hard error).
        </p>

        <h3 className={h3}>7.10 Server-side request forgery surface on the URL fetch</h3>
        <p>
          Once anonymous visitors could submit a whitepaper URL, that server-side fetch could be aimed
          at internal services or a cloud metadata endpoint. Added scheme, hostname, and
          resolved-address checks against private / loopback / link-local / CGNAT ranges, and disabled
          HTTP redirects on that fetch.
        </p>

        <h3 className={h3}>7.11 Tooling friction during backup and testing</h3>
        <p>
          Backing up before the public-flow work surfaced two environment issues: sensitive deployment
          variables cannot be read back through the platform CLI (they return a placeholder), and the
          local <code>pg_dump</code> client was a major version behind the managed database and
          refused to run. The backup was taken instead as a Prisma-driven JSON export of every table,
          alongside a Git tag of the pre-change commit.
        </p>

        <h3 className={h3}>7.12 Build corrupting the running dev server</h3>
        <p>
          Running a production build while the dev server was live left the dev server serving
          corrupted chunks (<code>__webpack_require__.C is not a function</code>), and the combined
          memory pressure of build + dev + a PDF render + a live model stream tripped the OS
          out-of-memory killer. Resolved by clearing the build directory, restarting with a bounded
          heap, and not building against a live dev server.
        </p>
      </section>

      {/* 8 */}
      <section>
        <h2 className={h2}>8. Known limitations and non-goals</h2>
        <ul className="space-y-1">
          <li className={li}>
            The output is automated analysis of the whitepaper text and public data. It is not legal
            advice and not a determination by any competent authority.
          </li>
          <li className={li}>
            It reads published MiCA text and selected technical standards as of the assessment date;
            it does not track every applicable obligation or subsequent regulatory change.
          </li>
          <li className={li}>
            Procedural items that cannot be verified from the document itself (NCA notification,
            website publication) are reported as such rather than guessed.
          </li>
          <li className={li}>
            AML / sanctions screening, on-chain holder-concentration analysis, and a separate token
            risk score are out of scope for this version — they need paid data sources.
          </li>
          <li className={li}>
            Around five pre-existing type-strictness errors are suppressed at build time and left for
            a dedicated pass; they are not runtime faults.
          </li>
        </ul>
      </section>

      {/* 9 */}
      <section>
        <h2 className={h2}>9. Development history</h2>
        <p>
          Built between June and September 2026. Selected milestones, most recent first:
        </p>
        <ul className="mt-2 space-y-1">
          <li className={li}>
            <span className="text-slate-200">Sep 2026 —</span> public no-login free-assessment flow:
            landing page, anonymous run and result pages, the layered one-per-visitor gate, single-use
            grant links, SSRF-hardened URL fetch, quote-rich public PDF, and the batched-streaming
            group-drop fix.
          </li>
          <li className={li}>
            <span className="text-slate-200">Aug 2026 —</span> non-scored market-context panel
            (CoinGecko data + MiCA disclaimers); the approve/reject review panel wired up; submit
            action fixed to a pure status transition; progress denominator fix.
          </li>
          <li className={li}>
            <span className="text-slate-200">Aug 2026 —</span> EXEMPT flag and the no-issuer cascade
            across the whole checklist; reserve / prudential citations tightened to EBA/ESMA technical
            standards; legal pages added; rename to &ldquo;MiCA ESMA Assessment Tool&rdquo;.
          </li>
          <li className={li}>
            <span className="text-slate-200">Aug 2026 —</span> opt-in public token registry with
            search and per-token preview; registry made the front door; lead-capture replacing a
            mailto CTA.
          </li>
          <li className={li}>
            <span className="text-slate-200">Aug 2026 —</span> whitepaper ingestion redesigned to
            accept upload or URL, both stored as PDF bytes; analysis persistence hardened against
            serverless teardown.
          </li>
          <li className={li}>
            <span className="text-slate-200">Jun 2026 —</span> initial platform: 13-group MiCA
            checklist, weighted scoring, AI extraction, PDF reporting, analyst authentication.
          </li>
        </ul>
      </section>

      {/* 10 */}
      <section>
        <h2 className={h2}>10. Contact</h2>
        <p>
          Daniel Moncada ·{" "}
          <a
            href="mailto:danielmoncada10@gmail.com"
            className="text-brand-400 hover:underline"
          >
            danielmoncada10@gmail.com
          </a>{" "}
          ·{" "}
          <a
            href="https://www.linkedin.com/in/daniel-moncada-leon/"
            target="_blank"
            rel="noreferrer"
            className="text-brand-400 hover:underline"
          >
            LinkedIn
          </a>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          See also the{" "}
          <a href="/legal/terms" className="text-brand-400 hover:underline">Terms of Use</a>,{" "}
          <a href="/legal/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>, and{" "}
          <a href="/legal/cookies" className="text-brand-400 hover:underline">Cookie Policy</a>.
        </p>
      </section>
    </>
  );
}
