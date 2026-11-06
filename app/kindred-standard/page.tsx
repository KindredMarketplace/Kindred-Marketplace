/**
 * /kindred-standard — the public definition of "vetted" on Kindred.
 *
 * This is the product. Families should be able to read exactly what every
 * caregiver had to show before they could appear in search, in plain words.
 * The list mirrors kindred_internal.meets_kindred_standard() in the database.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { KINDRED_STANDARD } from '@/lib/membership-shared';

export const metadata: Metadata = {
  title: 'The Kindred Standard',
  description:
    'What every caregiver on Kindred has to show before families can find them: a personal interview, 1,500+ hours of experience, a Level 2 background check, verified ID and their own liability insurance.',
};

export default function KindredStandardPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main>
        <section className="max-w-[1100px] mx-auto px-6 pt-16 pb-12 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">The Kindred Standard</div>
          <h1 className="font-display text-4xl md:text-6xl font-light leading-[1.05] max-w-3xl">
            What &ldquo;vetted&rdquo; <span className="italic font-medium text-gradient">actually means</span> here.
          </h1>
          <p className="mt-6 text-lg text-ink/70 max-w-2xl leading-relaxed">
            Letting someone into your home to care for a person you love is a big decision. So before
            any caregiver can appear on Kindred, they have to show us all five of these things. Not
            most of them. All of them.
          </p>
        </section>

        <section className="max-w-[1100px] mx-auto px-6 pb-16">
          <ol className="grid md:grid-cols-2 gap-5">
            {KINDRED_STANDARD.map((item, i) => (
              <li key={item.key} className="bg-white border border-ink/10 rounded-3xl p-6 sm:p-8">
                <div className="font-mono text-xs text-ink/40">{String(i + 1).padStart(2, '0')}</div>
                <div className="font-display text-2xl font-medium mt-2">{item.title}</div>
                <p className="text-ink/70 mt-2 leading-relaxed">{item.detail}</p>
              </li>
            ))}
            <li className="bg-deepteal text-cream rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs opacity-60">And then</div>
                <div className="font-display text-2xl font-medium mt-2">You talk to them first.</div>
                <p className="opacity-85 mt-2 leading-relaxed">
                  Message, call, meet. Ask what matters to you. You decide who comes into your home, and
                  you can talk to as many caregivers as you like before you choose.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="bg-mist/40 py-16">
          <div className="max-w-[1100px] mx-auto px-6 grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="font-display text-3xl font-light leading-tight">
                Checked again, <span className="italic">not just once.</span>
              </h2>
              <p className="text-ink/70 mt-4 leading-relaxed">
                Background checks, ID and insurance all carry dates. When something expires, that
                caregiver stops appearing in search until it&apos;s renewed. Families never have to wonder
                whether a badge is still true.
              </p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-light leading-tight">
                What Kindred <span className="italic">doesn&apos;t</span> do.
              </h2>
              <p className="text-ink/70 mt-4 leading-relaxed">
                Kindred is a platform, not an agency. We don&apos;t employ caregivers, set their rates, or
                take a cut of what you pay them. You hire your caregiver directly and agree on the work
                together. Our job is to make sure everyone you meet here has cleared the same high bar.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-[1100px] mx-auto px-6 py-16 grid md:grid-cols-2 gap-6">
          <Link
            href="/browse"
            className="card-hover bg-white border border-ink/10 rounded-3xl p-8 block"
          >
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50">For families</div>
            <div className="font-display text-2xl font-medium mt-2">Browse caregivers who meet it →</div>
          </Link>
          <Link
            href="/apply"
            className="card-hover bg-white border border-ink/10 rounded-3xl p-8 block"
          >
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50">For caregivers</div>
            <div className="font-display text-2xl font-medium mt-2">Think you meet it? Apply →</div>
            <p className="text-sm text-ink/60 mt-2">The first 25 approved caregivers get a full year free.</p>
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
