import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy | MiCA ESMA Assessment Tool" };

export default function CookiesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold font-display text-white mb-2">Cookie Policy</h1>
      <p className="text-xs text-slate-500 mb-8">Last updated: 10 September 2026</p>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">What we use</h2>
        <p>
          This Service uses a small number of first-party cookies. Every one of them is strictly
          necessary or functional — it is set only after you take a specific action, and it exists
          only to make the feature you invoked work. None is used for analytics, advertising,
          tracking, or profiling, and none can be read by JavaScript or by any third party (all are
          <code> HttpOnly</code>, <code>SameSite=Lax</code>, and <code>Secure</code> over HTTPS).
        </p>

        <p className="font-medium text-slate-200 mt-4">Session cookie (analysts, reviewers, admins)</p>
        <p>
          Set only when you sign in to the analyst area, to keep you authenticated between page loads.
          Removed when you sign out.
        </p>

        <p className="font-medium text-slate-200 mt-4">
          <code>mica_free_used</code> (public visitors)
        </p>
        <p>
          Set on your browser when you run a free assessment. It is a signed marker — no personal
          data — that records that this browser has used its one free assessment, so the
          one-per-visitor limit can be enforced without asking you to create an account. It lasts up
          to 180 days.
        </p>

        <p className="font-medium text-slate-200 mt-4">
          <code>mica_run_grant</code> (public visitors)
        </p>
        <p>
          A short-lived cookie (about one hour) set only when you open a single-use &ldquo;run another
          assessment&rdquo; link that an administrator has sent you. It carries that one-time
          entitlement from the link to the assessment form, and is deleted as soon as the assessment
          is created.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">What we don&rsquo;t use</h2>
        <p>
          No analytics, advertising, or third-party tracking cookies anywhere on this Service, and
          nothing that profiles you or follows you across other sites. We do not track which tokens an
          anonymous visitor searches for or views. Simply browsing the site — the landing page, the
          public registry, these legal pages — without signing in or running an assessment sets no
          cookie at all.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">Why there&rsquo;s no cookie banner</h2>
        <p>
          Under the EU ePrivacy rules, a consent banner is required for cookies that are{" "}
          <em>not</em> strictly necessary to provide a service you have asked for — typically
          analytics, advertising, or cross-site tracking cookies. Every cookie this Service sets is
          strictly necessary or functional: each is set only after an explicit action on your part
          (signing in, running a free assessment, or opening a single-use link), each is essential to
          the feature that action starts, and none is used for analytics, advertising, tracking, or
          profiling. On that basis no consent banner is used. If you would rather not accept the
          free-assessment cookies, you can browse the site and the registry without them and simply
          not run an assessment, or contact us at the address in our{" "}
          <a href="/legal/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-white mt-8 mb-2">Managing them</h2>
        <p>
          You can remove the session cookie by signing out, and clear all of these cookies at any
          time from your browser&rsquo;s site-data settings. Note that clearing{" "}
          <code>mica_free_used</code> does not itself reset the free-assessment limit: for the same
          reason it exists, the limit is also enforced server-side by a short-lived, salted one-way
          hash of your IP address (never the address itself) — see the{" "}
          <a href="/legal/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>.
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
