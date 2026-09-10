import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 pt-6 border-t border-slate-800 text-xs text-slate-600">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} MiCA ESMA Assessment Tool. Not legal or investment advice.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/legal/whitepaper" className="hover:text-slate-400 transition-colors">Whitepaper</Link>
          <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">Terms of Use</Link>
          <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <Link href="/legal/cookies" className="hover:text-slate-400 transition-colors">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
