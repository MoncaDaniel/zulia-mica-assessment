import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy | Zulia MiCA" };

export default function CookiesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold font-display text-white mb-2">Cookie Policy</h1>
      <p className="text-xs text-slate-500 mb-8">Last updated: 13 August 2026</p>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">What we use</h2>
        <p>
          This Service uses exactly one cookie: a session cookie set only when you sign in as an
          analyst, reviewer, or admin, to keep you authenticated between page loads. It is strictly
          necessary to provide the account access you explicitly requested by logging in.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">What we don&rsquo;t use</h2>
        <p>
          If you are browsing the public registry without logging in, no cookie is set on your device
          at all. We do not use analytics, advertising, or third-party tracking cookies anywhere on
          this Service, and we do not track which tokens an anonymous visitor searches for or views.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">Why there&rsquo;s no cookie banner</h2>
        <p>
          Under the EU ePrivacy rules, consent banners are required for cookies that are not strictly
          necessary to provide a service you&rsquo;ve asked for — typically analytics, advertising, or
          tracking cookies. Since the only cookie this Service sets is the login session cookie
          described above, and it is only ever set after you take the explicit action of signing in,
          no consent banner is required.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">Managing it</h2>
        <p>
          You can remove the session cookie at any time by signing out, or by clearing cookies for this
          site in your browser — either will simply sign you out.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">More information</h2>
        <p>
          See our <a href="/legal/privacy" className="text-brand-400 hover:underline">Privacy Policy</a> for
          how we handle personal data more broadly.
        </p>
      </section>
    </>
  );
}
