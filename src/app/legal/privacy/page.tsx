import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | MiCA ESMA Assessment Tool" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold font-display text-white mb-2">Privacy Policy</h1>
      <p className="text-xs text-slate-500 mb-8">Last updated: 10 September 2026</p>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">1. Who we are</h2>
        <p>
          This section refers to the operator of the MiCA ESMA Assessment Tool as &ldquo;we&rdquo; or
          &ldquo;us&rdquo;. For questions about this policy or to exercise any of the rights below,
          contact <a href="mailto:danielmoncada10@gmail.com" className="text-brand-400 hover:underline">danielmoncada10@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">2. What we collect</h2>

        <p className="font-medium text-slate-200 mt-3">If you browse the site or the public registry:</p>
        <p>
          Browsing the landing page, the public registry, and these legal pages requires no account
          and sets no cookie (see our{" "}
          <a href="/legal/cookies" className="text-brand-400 hover:underline">Cookie Policy</a>). We do
          not log which tokens an anonymous visitor searches for or views.
        </p>

        <p className="font-medium text-slate-200 mt-3">If you run a free assessment:</p>
        <p>
          We process the token name and ticker you enter and the whitepaper you provide — if you paste
          a URL we fetch it once and store a copy of the PDF. This is held as an assessment record
          under a shared internal system account, not linked to your identity. We also record a{" "}
          <span className="text-slate-200">salted, one-way hash of your IP address</span> (for IPv6,
          only the network prefix) — not the address itself, which we do not store and cannot recover
          from the hash — so that the &ldquo;one free assessment per visitor&rdquo; limit can be
          enforced without an account. A signed <code>mica_free_used</code> cookie is set for the same
          purpose (see the Cookie Policy).
        </p>

        <p className="font-medium text-slate-200 mt-3">
          If you submit a request (from the registry, or to run another assessment):
        </p>
        <p>
          The request form collects the email address you provide, and optionally a phone number, the
          name of the token you asked about, and a free-text note. We also store the same salted IP
          hash described above, used only to de-duplicate repeated requests from the same sender
          within a short window. If an administrator issues you a single-use link to run another
          assessment, we store the email address that link was issued to.
        </p>

        <p className="font-medium text-slate-200 mt-3">If you are an analyst, reviewer, or admin:</p>
        <p>
          We hold your name, email address, and hashed password to operate your account, plus a
          session cookie to keep you signed in (see our{" "}
          <a href="/legal/cookies" className="text-brand-400 hover:underline">Cookie Policy</a>), and
          an internal audit log of actions taken on assessments (e.g. created, submitted, approved) for
          compliance and accountability purposes.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">3. Why we process it, and on what basis</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Whitepaper, token name, and assessment records you submit through the free flow: to
            produce the analysis you requested. Legal basis: our legitimate interest (and, in effect,
            your request) in providing the tool you chose to use.</li>
          <li>The salted IP hash and the <code>mica_free_used</code> / <code>mica_run_grant</code>{" "}
            cookies: to enforce the one-free-assessment-per-visitor limit, honour single-use links, and
            protect the Service from automated abuse and runaway processing costs. Legal basis: our
            legitimate interest in operating a free tool sustainably and securely.</li>
          <li>Contact-request details: to respond to your request. Legal basis: our legitimate
            interest in following up on an inbound enquiry, and/or your consent given by submitting the
            form.</li>
          <li>Analyst account details: to provide you with access to the platform under an agreement
            with you or your employer. Legal basis: performance of a contract / legitimate interest in
            operating the Service securely.</li>
          <li>Audit logs: legal basis is our legitimate interest in maintaining an accurate compliance
            record of assessment activity.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">4. Retention</h2>
        <p>
          The salted IP-hash records used for the free-assessment limit are deleted automatically
          after about 90 days; single-use link records are deleted after they expire. We keep
          contact-request details for as long as needed to respond to and follow up on your request,
          and analyst account data for as long as your account is active. Assessment records submitted
          through the free flow (including the stored whitepaper copy) are kept for a limited period
          and removed on periodic review. We delete data earlier on request — see Section 6.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">5. Who we share it with</h2>
        <p>
          We do not sell personal data. It may be processed by our infrastructure providers acting on
          our instructions (hosting and database providers) solely to operate the Service. Whitepaper
          text submitted for analysis is sent to our AI processor (Anthropic) to generate the
          assessment; market-context lookups query third-party data sources (such as CoinGecko and the
          GLEIF registry) using the token name only, not your data. Information may be disclosed if
          required by law.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">6. Your rights</h2>
        <p>
          Subject to applicable law (including, for EU/EEA individuals, the GDPR), you may have the
          right to access, correct, delete, restrict, or object to our processing of your personal
          data, and to receive a copy of it in a portable format. To exercise any of these rights,
          email us at the address in Section 1. If you are in the EU/EEA and believe we have not
          resolved your request appropriately, you may lodge a complaint with your local data
          protection supervisory authority.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">7. Changes</h2>
        <p>We may update this policy from time to time; the &ldquo;Last updated&rdquo; date above reflects the latest revision.</p>
      </section>
    </>
  );
}
