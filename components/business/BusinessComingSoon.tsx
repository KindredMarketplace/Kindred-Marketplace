/**
 * BusinessComingSoon — shared placeholder for business pages not yet ported
 * from their HTML mock. Uses the portal shell (from app/business/layout.tsx).
 * Keeps nav working so the whole portal is walkable, while being honest that
 * the page isn't built yet.
 */

import Link from 'next/link';

export function BusinessComingSoon({
  title,
  eyebrow,
  description,
  mockFile,
}: {
  title: string;
  eyebrow: string;
  description: string;
  mockFile: string;
}) {
  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">{eyebrow}</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">{title}</h1>
        <p className="text-ink/70 mt-2 max-w-2xl">{description}</p>
      </section>

      <section className="fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-12 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h2 className="font-display text-2xl font-medium mb-2">This page is being built</h2>
          <p className="text-sm text-ink/60 max-w-md mx-auto mb-6">
            The design exists in the mock (<span className="font-mono text-ink/70">{mockFile}</span>)
            and will be ported into the live app in this session, wired to real facility data.
          </p>
          <Link
            href="/business/dashboard"
            className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition"
          >
            ← Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
