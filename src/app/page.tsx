import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";

// The landing page is the front door. A visitor with a real analyst/reviewer/
// admin session skips straight to the dashboard; everyone else sees this and
// runs a free assessment from here. /login still works if you know the URL.
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="font-display text-lg font-bold text-white">
          MiCA <span className="text-brand-500">ESMA</span>
        </span>
        <Link
          href="/check"
          className="text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          Registry
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">
            Regulation (EU) 2023/1114 · MiCA
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Check a token&apos;s whitepaper against MiCA in about 90 seconds
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-400">
            Submit a crypto-asset whitepaper. The pipeline evaluates it against all 13 groups of MiCA
            Annex I mandatory disclosures and the ESMA and EBA regulatory technical standards and
            guidelines that implement them, cross-references market and legal-entity data, and returns
            a fully-cited report — every finding bound to the passage it rests on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/run"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Run a free assessment
            </Link>
            <Link
              href="/check"
              className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              Browse assessed tokens
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            One free assessment per visitor. Need more? Request them by email — no account required.
          </p>
        </section>

        {/* What you get */}
        <section className="border-t border-slate-800 py-14">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-slate-500">
            What you get
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "The full Annex I checklist",
                body: "Every mandatory disclosure across 13 requirement groups — offeror and issuer identity, offer terms, holder rights, technology, risk factors, sustainability, reserves and prudential rules — each bound to its MiCA article and to the ESMA/EBA technical standard or guideline that operationalises it.",
              },
              {
                title: "Evidence, not a verdict",
                body: "Every finding carries the verbatim whitepaper passage it rests on; where a disclosure is absent, the closest language in the document and a statement of why it is insufficient. Market, supply and legal-entity context is attached separately.",
              },
              {
                title: "A structured report",
                body: "The full assessment as a PDF — weighted score, per-group breakdown, quoted evidence under each item, tokenomics, and the standing MiCA and transitional-regime caveats.",
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-800 py-14">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-slate-500">
            How it works
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["1", "Submit the whitepaper", "A direct PDF link or an upload, with the token name and ticker."],
              ["2", "Extraction runs", "Context is retrieved, then the document is processed group by group; findings stream to the page as each group resolves."],
              ["3", "Retrieve the report", "The full cited PDF is available once extraction completes — roughly 90 seconds."],
            ].map(([n, title, body]) => (
              <li key={n} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <span className="font-display text-2xl font-bold text-brand-500">{n}</span>
                <h3 className="mt-2 font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
              </li>
            ))}
          </ol>

          {/* Under the hood — technical description */}
          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-slate-500">
              Under the hood
            </h3>

            <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-400">
              <div>
                <h4 className="mb-1.5 font-semibold text-slate-200">Regulatory model</h4>
                <p>
                  MiCA Article 6 and Annex I are decomposed into 13 requirement groups and
                  approximately 75 atomic disclosure items. Each item is bound both to its Level 1
                  provision (article or Annex paragraph) and to the Level 2 / Level 3 instrument that
                  operationalises it — the ESMA regulatory and implementing technical standards and
                  guidelines, the delegated regulations on sustainability indicators and on the
                  crypto-asset classification note, and, for asset-referenced and e-money tokens, the
                  EBA technical standards and guidelines governing reserve composition and liquidity,
                  own-funds requirements, and recovery and redemption plans. Group scores are the
                  ratio of disclosed items to applicable items; the aggregate is a fixed-weight mean
                  banded into <span className="text-green-400">PASS</span> (≥ 75%),{" "}
                  <span className="text-amber-400">REVIEW</span> (50–74%) and{" "}
                  <span className="text-red-400">FAIL</span> (&lt; 50%). Assets with no identifiable
                  issuer or offeror are resolved to <span className="text-sky-400">EXEMPT</span> under
                  Article 4(3) and Recital 22 before scoring, since the Title II whitepaper regime
                  never attached.
                </p>
              </div>

              <div>
                <h4 className="mb-1.5 font-semibold text-slate-200">Extraction architecture</h4>
                <p>
                  The application runs as serverless functions on a Next.js runtime. A typed tool-use
                  schema constrains a large language model to emit, per disclosure item, a status
                  (found / not&nbsp;found / not&nbsp;applicable / insufficient), a verbatim excerpt
                  with a section or page locator, a confidence value, and a rationale. The 13 groups
                  are partitioned into four batches executed as concurrent inference calls to stay
                  within the platform function-duration ceiling; partial responses are parsed
                  incrementally, each group is persisted the moment it resolves and streamed to the
                  client over Server-Sent Events, and a set-based reconciliation pass guarantees a
                  group emitted out of order is still captured. A separate short pass produces the
                  executive narrative; for no-issuer assets that narrative is a deterministic template
                  rather than a generated one.
                </p>
              </div>

              <div>
                <h4 className="mb-1.5 font-semibold text-slate-200">Context enrichment</h4>
                <p>
                  Ahead of extraction the pipeline retrieves and normalises external context: market
                  and developer metrics from CoinGecko, verified legal-entity records from the GLEIF
                  LEI registry, and a bounded crawl of the project&rsquo;s own domain, documentation
                  and marketing surfaces for the Article 7 marketing-communication checks. This
                  material is presented to the model as separately labelled evidence and is never
                  permitted to satisfy a disclosure that MiCA requires the whitepaper itself to make.
                </p>
              </div>

              <div>
                <h4 className="mb-1.5 font-semibold text-slate-200">Report generation</h4>
                <p>
                  The report is rendered server-side to PDF: cover, executive summary with the
                  weighted breakdown and a tokenomics table, one section per requirement group with
                  the quoted evidence beneath each item, and flag-specific remediation actions. It is
                  an automated analysis of the submitted document and public data — not legal advice,
                  and not a determination by any competent authority.
                </p>
              </div>

              <div>
                <h4 className="mb-1.5 font-semibold text-slate-200">Access controls</h4>
                <p>
                  The one-assessment-per-visitor limit is enforced by a signed{" "}
                  <code>HttpOnly</code> cookie together with a salted, truncated one-way hash of the
                  client address (IPv6 reduced to its /64 prefix; raw addresses are never stored), a
                  global daily ceiling, and a per-source rate limit. Additional runs are issued as
                  single-use, expiring tokens. The whitepaper-URL fetch resolves DNS and rejects
                  private, loopback, link-local and carrier-grade-NAT ranges and cloud metadata
                  endpoints, and follows no redirects.
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              The full architecture, the regulatory mapping in detail, and the engineering problems
              resolved during development are documented in the{" "}
              <Link href="/legal/whitepaper" className="text-brand-400 underline-offset-2 hover:underline">
                technical whitepaper
              </Link>
              .
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-800 py-14">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-white">Try it on a token you know</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
              Run your free assessment now, then request more by email if it&apos;s useful.
            </p>
            <Link
              href="/run"
              className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Run a free assessment
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-slate-600">
            Automated analysis, not legal or investment advice. Always verify against the official
            ESMA and national competent authority MiCA registers.
          </p>
        </section>

        <Footer />
      </main>
    </div>
  );
}
