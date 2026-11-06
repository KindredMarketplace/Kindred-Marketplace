/**
 * /insurance-billing — ported from Front-End/Homepage/insurance-billing.html, honest.
 *
 * The mock claimed Kindred files directly with 30+ LTC carriers, accepts VA and
 * FL Medicaid waivers, GPS clock-in, auto-files insurance weekly, and carries
 * $2M Chubb liability + $25K bond + occupational accident insurance. None of
 * that is built. Per the real plan (self-pay first; LTC = we provide the docs
 * you file; Medicaid/VA later), this version is honest about what's available
 * today vs. on the roadmap, and drops every fabricated figure and underwriter.
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

type Status = 'now' | 'roadmap' | 'no';
const STATUS_STYLE: Record<Status, string> = {
  now: 'bg-sage/25 text-deepteal',
  roadmap: 'bg-butter/40 text-ink',
  no: 'bg-ink/10 text-ink/60',
};
const STATUS_LABEL: Record<Status, string> = {
  now: 'Available now',
  roadmap: 'On the roadmap',
  no: 'Not covered',
};

const PAYMENT_SOURCES: { icon: string; title: string; status: Status; body: string }[] = [
  {
    icon: '💳', title: 'Self-pay (private pay)', status: 'now',
    body: 'Pay securely through Kindred by card or bank transfer. You pay for care as it\u2019s delivered, and you get clear, itemized receipts you can keep for your records or a tax preparer.',
  },
  {
    icon: '💼', title: 'Long-term care insurance', status: 'roadmap',
    body: 'Most major LTC policies reimburse for in-home CNA care. We\u2019re building tools to generate the visit logs and itemized invoices these carriers require — so you can file your own claim easily. (We don\u2019t bill the insurer directly.)',
  },
  {
    icon: '🎖', title: 'VA benefits', status: 'roadmap',
    body: 'Veterans may qualify for in-home care help through programs like Aid & Attendance or Veteran-Directed Care. Helping you assemble what those programs need is on our roadmap.',
  },
  {
    icon: '🏛', title: 'Florida Medicaid', status: 'roadmap',
    body: 'Florida Medicaid can cover in-home aide services for eligible waiver enrollees. Supporting this involves licensing and compliance work we\u2019re approaching carefully — it\u2019s a later phase, and we\u2019ll say so plainly until it\u2019s real.',
  },
];

export default function InsuranceBillingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* HERO */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Insurance &amp; billing</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          Straight answers about <span className="italic font-medium text-gradient">paying for care.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          Paying for care is confusing enough. We&apos;ll always tell you plainly what Kindred
          supports today and what&apos;s still being built — never imply coverage that isn&apos;t there.
        </p>
      </section>

      {/* WAYS TO PAY */}
      <section className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Ways to pay</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8">What you can use, and where we are with it</h2>

        <div className="grid md:grid-cols-2 gap-5">
          {PAYMENT_SOURCES.map((s) => (
            <div key={s.title} className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{s.icon}</div>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <h3 className="font-display text-xl font-medium mb-2">{s.title}</h3>
              <p className="text-sm text-ink/75 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-coral/10 border border-coral/30 rounded-2xl p-5 text-sm leading-relaxed">
          <strong>About Medicare:</strong> Original Medicare generally does <em>not</em> cover routine
          non-medical home care (help with bathing, dressing, companionship). It may cover skilled
          nursing or therapy for qualifying conditions. Some Medicare Advantage plans now include
          limited in-home benefits — if you have one, it&apos;s worth checking your specific plan. We
          won&apos;t imply coverage that isn&apos;t there.
        </div>
      </section>

      {/* HOW SELF-PAY WORKS */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">How paying works today</div>
          <h2 className="font-display text-3xl md:text-4xl font-light mb-10">Self-pay, start to finish</h2>

          <div className="space-y-4">
            {[
              ['Agree on the details', 'You and your caregiver agree on the schedule and their hourly rate, right in Kindred.'],
              ['Care is delivered', 'Your caregiver does what you hired them for. Hours are recorded so billing matches reality.'],
              ['Pay securely through Kindred', 'Payment is processed through the platform — no cash, no handling it off the books — and your caregiver is paid promptly.'],
              ['Keep clean records', 'You get itemized receipts, and a tax-ready summary you can hand to a preparer if care qualifies as a medical expense.'],
            ].map(([title, body], i) => (
              <div key={title} className="bg-white border border-ink/10 rounded-2xl p-6 grid md:grid-cols-[60px_1fr] gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-teal text-cream flex items-center justify-center font-display text-lg">{i + 1}</div>
                <div>
                  <div className="font-display text-lg font-medium mb-1">{title}</div>
                  <p className="text-sm text-ink/75 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink/55 mt-5">
            Automated insurance filing and verified clock-in are on the roadmap. When they&apos;re
            real, they&apos;ll be described here precisely.
          </p>
        </div>
      </section>

      {/* PROTECTIONS — honest today vs building */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Protections</div>
        <h2 className="font-display text-3xl md:text-4xl font-light mb-8">What protects everyone</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-deepteal mb-2">Today</div>
            <h3 className="font-display text-lg font-medium mb-2">Vetting &amp; a clear record</h3>
            <p className="text-sm text-ink/75 leading-relaxed">
              Every caregiver is interviewed and fully verified before they appear. Arrangements and
              payments run on-platform, so there&apos;s always a record — and a real person at Kindred
              to talk to if something feels off.
            </p>
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-2">Building</div>
            <h3 className="font-display text-lg font-medium mb-2">Insurance-backed coverage</h3>
            <p className="text-sm text-ink/75 leading-relaxed">
              Liability coverage for active shifts and protections for caregivers are on our roadmap.
              When they&apos;re real and independently backed, we&apos;ll publish the specifics — never
              a dollar figure we can&apos;t stand behind.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-mist/40 py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="font-display text-3xl font-light text-center mb-10">Frequently asked</h2>
          <div className="space-y-3">
            <Faq q="Can I deduct caregiver costs on my taxes?">
              If your loved one qualifies as a dependent and the care counts as medical care, those
              costs can often be itemized as medical expenses (IRS Schedule A). We provide records to
              support that — but check with a tax professional for your specific situation.
            </Faq>
            <Faq q="Will my long-term care insurance reimburse this?">
              Most major LTC policies reimburse for in-home CNA care. Kindred doesn&apos;t bill the
              insurer directly; instead, our roadmap includes generating the visit logs and itemized
              invoices you need to file your own claim.
            </Faq>
            <Faq q="Do I need to issue a 1099 to my caregiver?">
              No. Caregivers on Kindred are independent professionals, and Kindred handles their 1099
              reporting — you&apos;re not the payer of record.
            </Faq>
            <Faq q="Why not just pay cash off the platform?">
              We don&apos;t recommend it. Off-platform payments leave no record, won&apos;t appear on
              tax documents, and sit outside any future protections — keeping care on-platform keeps
              everyone covered as those protections come online.
            </Faq>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center max-w-[900px] mx-auto px-6">
        <h3 className="font-display text-3xl font-light mb-3">Questions about your situation?</h3>
        <p className="text-ink/70 mb-6">A real person will help you think it through.</p>
        <Link href="/contact" className="inline-flex bg-deepteal text-cream px-6 py-3 rounded-full text-sm hover:bg-inkdark transition">Contact us</Link>
      </section>

      <SiteFooter />
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="bg-white border border-ink/10 rounded-2xl p-5 group">
      <summary className="font-medium cursor-pointer flex items-center justify-between">
        {q}
        <span className="text-deepteal text-xl group-open:rotate-45 transition">+</span>
      </summary>
      <p className="text-sm text-ink/75 mt-3 leading-relaxed">{children}</p>
    </details>
  );
}
