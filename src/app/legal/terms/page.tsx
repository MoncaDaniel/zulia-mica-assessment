import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use | Zulia MiCA" };

export default function TermsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold font-display text-white mb-2">Terms of Use</h1>
      <p className="text-xs text-slate-500 mb-8">Last updated: 13 August 2026</p>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">1. Acceptance of these terms</h2>
        <p>
          These Terms of Use govern your access to and use of the Zulia MiCA platform, including the
          public token registry, the compliance-assessment tool, and any related pages (the
          &ldquo;Service&rdquo;), operated by Zulia Networks (&ldquo;Zulia&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By browsing the registry, submitting a contact request, or logging in as
          an analyst, you agree to these terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">2. What the Service is</h2>
        <p>
          The Service produces a compliance-oriented analysis of crypto-asset whitepapers against
          disclosure requirements under Regulation (EU) 2023/1114 (&ldquo;MiCA&rdquo;) and related
          technical standards. Findings are generated with the assistance of an AI model, reviewed by
          a human analyst before an assessment is marked Approved, and — only where an analyst
          explicitly opts a specific assessment in — a limited summary (token name, ticker, overall
          compliance flag, and review date) may be published to the public registry.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">3. Not legal or investment advice</h2>
        <p>
          Nothing on this Service constitutes legal, regulatory, financial, or investment advice, and
          no assessment, score, or flag constitutes a determination by any regulator or competent
          authority. The Service reflects our reading of published MiCA text and selected technical
          standards as of the date an assessment was performed; it does not capture every applicable
          obligation, does not account for subsequent regulatory developments, and may not apply
          correctly to every fact pattern. Always obtain independent legal advice before making any
          decision — including whether to invest in, list, or offer a crypto-asset — based on
          information from this Service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">4. No warranty; limitation of liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranty
          of any kind, express or implied, including as to accuracy, completeness, or fitness for a
          particular purpose. To the maximum extent permitted by applicable law, Zulia Networks shall
          not be liable for any direct, indirect, incidental, consequential, or special damages arising
          from or in connection with your use of, or reliance on, the Service, including decisions made
          on the basis of an assessment, score, or registry listing.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">5. Public registry and third-party tokens</h2>
        <p>
          Registry listings reflect only the crypto-assets an analyst has chosen to assess and publish;
          absence from the registry does not imply non-compliance, and presence does not constitute an
          endorsement or certification of the token, its issuer, or any related offering. Token
          issuers, projects, and marks referenced on this Service belong to their respective owners and
          are used solely for identification.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">6. Contact requests</h2>
        <p>
          If you submit an email address and phone number through the &ldquo;request an
          assessment&rdquo; form, you are asking us to contact you about that request. See our{" "}
          <a href="/legal/privacy" className="text-brand-400 hover:underline">Privacy Policy</a> for how
          that information is used and retained.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">7. Analyst accounts</h2>
        <p>
          Access to the assessment-creation and review tooling is restricted to authorised analysts,
          reviewers, and administrators. You are responsible for maintaining the confidentiality of
          your credentials and for all activity under your account.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">8. Changes</h2>
        <p>
          We may update these terms or the Service at any time. Continued use after a change
          constitutes acceptance of the updated terms.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">9. Governing law</h2>
        <p>
          These terms are governed by the laws applicable in Zulia Networks&rsquo; place of
          establishment, without regard to conflict-of-laws principles, unless mandatory local
          consumer-protection law provides otherwise.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">10. Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:danielmoncada10@gmail.com" className="text-brand-400 hover:underline">danielmoncada10@gmail.com</a>.
        </p>
      </section>
    </>
  );
}
