/**
 * /faq — questions families ask before and after they join: how caregivers
 * are checked, membership, paying a caregiver directly, and the household
 * employer basics (IRS thresholds, HomePay pointer). Content lives in
 * components/family/FamilyFaqs.tsx, shared with the family Help center.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FAQ_GROUPS, FaqList } from '@/components/family/FamilyFaqs';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Questions families ask | Kindred',
  description: 'How Kindred checks caregivers, what membership includes, paying a caregiver directly, and household employer basics.',
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 lg:py-16">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For families</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight mb-3">
          Questions families <span className="italic font-medium text-gradient">ask us.</span>
        </h1>
        <p className="text-ink/70 max-w-2xl mb-6">
          Straight answers about how Kindred works, what it costs, and what hiring a caregiver directly means for you.
        </p>
        <nav className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 mb-8 [scrollbar-width:none]" aria-label="Topics">
          {FAQ_GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="shrink-0 whitespace-nowrap rounded-full border border-ink/15 bg-white px-4 py-2 text-sm hover:bg-mist">
              {g.title}
            </a>
          ))}
        </nav>
        {FAQ_GROUPS.map((g) => (
          <section key={g.id} id={g.id} className="mb-10 scroll-mt-24">
            <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">{g.title}</h2>
            <FaqList faqs={g.faqs} />
          </section>
        ))}
        <div className="mt-12 bg-white border border-ink/10 rounded-3xl p-6 sm:p-8 text-center">
          <h2 className="font-display text-2xl font-medium mb-2">Still have a question?</h2>
          <p className="text-sm text-ink/70 mb-4">
            Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-deepteal underline">{CONTACT_EMAIL}</a> and a real
            person on the Kindred team will reply.
          </p>
          <Link href="/browse" className="inline-block bg-deepteal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-inkdark transition">
            Browse caregivers
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
