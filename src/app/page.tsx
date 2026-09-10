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
            Upload a crypto-asset whitepaper. Claude assesses it against all 13 groups of MiCA Annex I
            mandatory disclosures, pulls the token&apos;s market data, and returns a full report —
            with the exact whitepaper passages behind every finding.
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
                body: "Every mandatory disclosure across 13 groups — offeror and issuer identity, offer terms, rights, technology, risk factors, sustainability, reserves and prudential rules — each mapped to its MiCA article.",
              },
              {
                title: "Evidence, not just a verdict",
                body: "Each finding cites the whitepaper passage it rests on, and where a disclosure is missing you see the closest language and why it falls short. Token market data and supply figures included.",
              },
              {
                title: "A downloadable report",
                body: "The complete assessment as a PDF you can keep or forward — score, per-group breakdown, quoted evidence, tokenomics, and the standing MiCA caveats.",
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
              ["1", "Add the whitepaper", "Paste a direct PDF link or upload the file, with the token name."],
              ["2", "Watch it analyse", "Findings stream in group by group as Claude reads the document and market data."],
              ["3", "Download the report", "Get the full PDF once it finishes — about 90 seconds."],
            ].map(([n, title, body]) => (
              <li key={n} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <span className="font-display text-2xl font-bold text-brand-500">{n}</span>
                <h3 className="mt-2 font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
              </li>
            ))}
          </ol>

          {/* Under the hood — fuller tech + product description */}
          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-slate-500">
              Under the hood
            </h3>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-400">
              <p>
                <span className="text-slate-200">The compliance model.</span> MiCA Article 6 and
                Annex I are decomposed into 13 requirement groups and roughly 75 individual disclosure
                items, each mapped to its specific article or Annex paragraph — offeror and issuer
                identity, offer terms, holder rights, underlying technology, risk factors,
                sustainability impacts, and the reserve, prudential, format, prohibited-content and
                procedural rules. Each group scores as the share of its applicable items that are
                actually disclosed; the overall score is a fixed-weight average (risk factors and
                holder rights weigh heaviest), banded into{" "}
                <span className="text-green-400">PASS</span> (≥ 75%),{" "}
                <span className="text-amber-400">REVIEW</span> (50–74%) and{" "}
                <span className="text-red-400">FAIL</span>. A crypto-asset with no identifiable issuer
                — mined or staked into existence with no treasury or controlling party — is flagged{" "}
                <span className="text-sky-400">EXEMPT</span> under Article 4(3) / Recital 22 and scored
                on nothing, because Title II never applied to it.
              </p>

              <p>
                <span className="text-slate-200">The analysis.</span> The whitepaper is read by
                Anthropic&rsquo;s Claude using structured tool-use, split into four concurrent batched
                calls so a full run stays inside the serverless time budget (~90 seconds, ~US$0.40 of
                model usage). It is supplemented with live context — CoinGecko market and developer
                data, GLEIF legal-entity verification, and a targeted scrape of the project&rsquo;s own
                site and marketing pages for the Article 7 checks. Every finding carries a status, a
                verbatim quote from the document (or the closest language, where a disclosure is
                missing), a confidence value, and a short rationale. Results stream into the page group
                by group and are saved as they land, so a slow batch never loses earlier work.
              </p>

              <p>
                <span className="text-slate-200">The output.</span> A full PDF report — cover,
                executive summary with the weighted breakdown and a tokenomics table, one page per
                requirement group with the quoted evidence under each item, and flag-specific next
                steps. It is automated analysis of the document and public data, not legal advice and
                not a determination by any regulator.
              </p>

              <p>
                <span className="text-slate-200">The free flow.</span> One assessment per visitor, no
                account. The limit is enforced with a signed cookie backed by a salted hash of the IP
                (raw addresses are never stored), a global daily cap, and a short throttle; a second
                run is issued as a single-use link in reply to an email request. The URL-fetch path
                refuses internal and cloud-metadata addresses and follows no redirects.
              </p>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Full architecture, the assessment model in detail, and the engineering problems solved
              along the way are in the{" "}
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
