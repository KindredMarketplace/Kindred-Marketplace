/**
 * /careers — ported from Front-End/Homepage/careers.html, made honest.
 *
 * The mock invented headcount ("23 people"), profitability, seven open roles
 * with salary bands, a full benefits package, and a five-step hiring process —
 * none of which is real for an early-stage team. This is the honest version:
 * we're small, not formally hiring yet, and open to hearing from the right
 * people. Roles will be listed here when they exist.
 */

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const CONTACT_EMAIL = 'kindredhhcmarketplace@gmail.com';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-24 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Careers at Kindred</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Help us build the care system{' '}
          <span className="italic font-medium text-gradient">we wish our families had.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          We&apos;re a small, early-stage team in Gainesville. We&apos;re building carefully and
          hiring slowly — but we always want to meet people who care about this work as much as we do.
        </p>
      </section>

      {/* No open roles yet — honest */}
      <section className="max-w-[900px] mx-auto px-6 pb-12">
        <div className="bg-white border border-ink/10 rounded-3xl p-8 md:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-kindred-gradient mx-auto flex items-center justify-center text-cream font-display text-xl mb-4">✦</div>
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">No open roles posted right now.</h2>
          <p className="text-ink/70 leading-relaxed max-w-xl mx-auto mb-6">
            When we&apos;re ready to hire, the open positions will live right here. In the meantime, if
            you have deep experience in senior care, healthcare operations, or building marketplaces —
            and Kindred&apos;s mission resonates — we&apos;d genuinely like to hear from you.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Joining the Kindred team`}
            className="inline-flex bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition"
          >
            Introduce yourself →
          </a>
        </div>
      </section>

      {/* What we care about (honest, no fabricated benefits) */}
      <section className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">How we want to work</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8">What matters to us</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            ['Mission over hype', 'We\u2019re here because caregivers are undervalued and families are underserved. Everything else is downstream of fixing that.'],
            ['Honesty as a habit', 'We say what\u2019s real — to families, to caregivers, and to each other. No fabricated numbers, no overpromising.'],
            ['Care for the work', 'Small team, real ownership, no politics. We move carefully because the stakes — someone\u2019s loved one — are real.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6">
              <h3 className="font-display text-xl font-medium mb-2">{title}</h3>
              <p className="text-sm text-ink/75 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
