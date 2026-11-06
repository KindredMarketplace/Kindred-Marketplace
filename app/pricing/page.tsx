/**
 * /pricing — membership pricing (platform model, Nov 2026).
 *
 * Kindred charges for ACCESS, never for care:
 *   - a one-time startup fee + a monthly membership, per side
 *   - prices come live from public.access_plans (no hard-coded numbers)
 *   - caregivers keep 100% of the rate they set; families pay them directly
 *   - the first 25 approved caregivers get a full year free
 *
 * The old "service fee on top of the caregiver's rate" model is gone: taking
 * a cut of care fees is what makes a business an agency / nurse registry.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';
import { getAllPlans } from '@/lib/membership';
import { dollars, type AccessPlan } from '@/lib/membership-shared';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Kindred charges a simple membership. Never a cut of care. Caregivers keep 100% of their rate.',
};

export default async function PricingPage() {
  const supabase = await createClient();
  const plans = await getAllPlans(supabase);
  const family = plans.find((p) => p.role === 'client');
  const caregiver = plans.find((p) => p.role === 'cna');

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      <section className="max-w-[1100px] mx-auto px-6 py-16 lg:py-20 text-center fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Pricing</div>
        <h1 className="font-display text-5xl md:text-6xl font-light leading-tight mb-5">
          A membership. <span className="italic font-medium text-gradient">Never a cut.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          Kindred makes money one way: memberships. We don&apos;t take a percentage of care, we
          don&apos;t add fees to a caregiver&apos;s rate, and we don&apos;t sit in the middle of what a
          family pays their caregiver.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-5">
          <PlanCard
            eyebrow="For families"
            plan={family}
            points={[
              'Browse every listed caregiver free, before you pay anything',
              'Names, photos and messaging unlock with membership',
              'Talk to as many caregivers as you like before you choose',
              'Pay your caregiver directly, at the rate they set',
              'Cancel anytime',
            ]}
            cta={{ href: '/signup?role=client', label: 'Create a family account' }}
          />
          <PlanCard
            eyebrow="For caregivers"
            plan={caregiver}
            highlight="First 25 approved caregivers: a full year free, startup fee included."
            points={[
              'Set your own rate and keep 100% of it',
              'Choose your hours, your area and the families you work with',
              'Families come to you already knowing you meet the Kindred Standard',
              'No agency, no insurance billing paperwork',
              'Cancel anytime',
            ]}
            cta={{ href: '/apply', label: 'Apply to Kindred' }}
          />
        </div>
      </section>

      <section className="bg-mist/40 py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="font-display text-3xl font-light text-center mb-8">
            Why it works <span className="italic">this way</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 text-sm text-ink/75 leading-relaxed">
            <div className="bg-white border border-ink/10 rounded-2xl p-5">
              <div className="font-medium text-ink mb-1">Agencies take the bigger half</div>
              A family can pay an agency far more per hour than the caregiver ever sees. Without a
              middleman, families can pay less and caregivers can earn more.
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-5">
              <div className="font-medium text-ink mb-1">You hire directly</div>
              You and your caregiver agree on the work, the schedule and the rate. Kindred isn&apos;t
              the employer and never touches that money.
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-5">
              <div className="font-medium text-ink mb-1">Membership pays for trust</div>
              Interviews, background and ID checks, and insurance verification cost real money.
              Membership covers it, and keeps the bar high.
            </div>
          </div>
          <p className="text-center text-xs text-ink/50 mt-8">
            Kindred is for families paying privately. We don&apos;t bill Medicare, Medicaid or
            insurance.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function PlanCard({
  eyebrow,
  plan,
  points,
  cta,
  highlight,
}: {
  eyebrow: string;
  plan: AccessPlan | undefined;
  points: string[];
  cta: { href: string; label: string };
  highlight?: string;
}) {
  return (
    <div className="bg-white border border-ink/10 rounded-3xl p-7 flex flex-col">
      <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">{eyebrow}</div>
      {plan ? (
        <>
          <div className="font-display text-5xl font-medium">
            {dollars(plan.monthly_cents)}
            <span className="text-base text-ink/50 font-sans">/month</span>
          </div>
          {plan.startup_fee_cents > 0 && (
            <div className="text-sm text-ink/60 mt-1">+ {dollars(plan.startup_fee_cents)} one-time startup fee</div>
          )}
        </>
      ) : (
        <div className="font-display text-3xl font-medium">Membership</div>
      )}
      {highlight && (
        <div className="mt-4 bg-butter/50 text-deepteal text-sm font-medium rounded-xl px-4 py-3">{highlight}</div>
      )}
      <ul className="space-y-2.5 text-sm mt-6 mb-8">
        {points.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="text-deepteal mt-0.5">✓</span> {t}
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className="mt-auto block text-center bg-deepteal text-cream py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition"
      >
        {cta.label}
      </Link>
    </div>
  );
}
