import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | MiCA ESMA Assessment Tool" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold font-display text-white mb-2">Privacy Policy</h1>
      <p className="text-xs text-slate-500 mb-8">Last updated: 13 August 2026</p>

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
        <p className="font-medium text-slate-200 mt-3">If you browse the public registry:</p>
        <p>
          Browsing and searching the registry does not require an account and does not set any
          tracking cookie (see our <a href="/legal/cookies" className="text-brand-400 hover:underline">Cookie Policy</a>).
          We do not log which tokens an anonymous visitor searches for or viewed.
        </p>
        <p className="font-medium text-slate-200 mt-3">If you submit a contact request:</p>
        <p>
          The &ldquo;request an assessment&rdquo; form collects the email address and phone number you
          provide, and, where applicable, the name of the token you asked about. This is the only
          personal data collected from public visitors.
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
          We keep contact-request details for as long as needed to respond to and follow up on your
          request, and analyst account data for as long as your account is active. We delete data
          earlier on request — see Section 6 — and otherwise periodically review and remove data we no
          longer need.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">5. Who we share it with</h2>
        <p>
          We do not sell personal data. It may be processed by our infrastructure providers acting on
          our instructions (hosting and database providers) solely to operate the Service, and may be
          disclosed if required by law.
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
