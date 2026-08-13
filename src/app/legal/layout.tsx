import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg text-white">
            Zulia <span className="text-brand-500">MiCA</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to registry
          </Link>
        </div>

        <div className="prose-legal text-slate-300 text-sm leading-relaxed space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
