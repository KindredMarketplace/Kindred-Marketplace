/**
 * /cna/resources — guides for caregivers who already do this work.
 *
 * Honest version of the CNA-Portal/resources.html mock. Removed: the career
 * ladder with invented pay bumps, the "Training near you" list of partner
 * schools with made-up prices and a referral discount, the LPN/RN pathway
 * promos, tier-based tips, and a fake monthly meetup. Kindred doesn't run a
 * training pipeline. What's left is a list of planned guides (marked "coming
 * soon", not linked to articles that don't exist yet) and honest empty states.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const PLANNED_GUIDES = [
  { emoji: '💵', grad: 'from-sage/40 via-butter/30 to-coral/30', cat: 'Money', title: 'Setting your rate', desc: 'How to price your time, talk about overtime and holidays, and put what you agree on in writing.' },
  { emoji: '🧾', grad: 'from-butter/40 to-sage/30', cat: 'Money', title: 'Taxes when families pay you directly', desc: 'Self-employment basics, quarterly estimates, and when a family may count as a household employer.' },
  { emoji: '🧠', grad: 'from-teal/40 to-sky/30', cat: 'Care', title: 'Sundowning: a gentle guide', desc: 'Why some people living with dementia get anxious in the late afternoon, and what helps in the moment.' },
  { emoji: '🛡️', grad: 'from-sky/30 to-deepteal/30', cat: 'Safety', title: 'When to call 911 vs the family first', desc: 'A simple way to decide what to do in an in-home emergency.' },
  { emoji: '💛', grad: 'from-coral/30 to-sage/40', cat: 'Wellbeing', title: 'Avoiding caregiver burnout', desc: 'The signs to watch for in yourself, and what to do when you feel them creeping in.' },
];

export default async function CnaResourcesPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-sky/15 blur-3xl pointer-events-none" />
        <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-16 fade-up relative">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Resources</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
            Guides for <span className="italic font-medium text-gradient">working on your own.</span>
          </h1>
          <p className="text-ink/70 mt-4 text-lg leading-relaxed max-w-2xl">
            Practical help for experienced caregivers: setting your rate, handling taxes when
            families pay you directly, and taking care of yourself along the way. We&rsquo;re writing
            these with real caregivers, so they&rsquo;ll appear here as they&rsquo;re ready.
          </p>
        </div>
      </section>

      <main className="max-w-kindred mx-auto px-6 pb-16">
        {/* PLANNED GUIDES */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.05s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Reading list</div>
          <h2 className="font-display text-3xl font-medium mb-6">Tips &amp; guides</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLANNED_GUIDES.map((a) => (
              <div key={a.title} className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
                <div className={`h-32 bg-gradient-to-br ${a.grad} flex items-center justify-center text-4xl`}>{a.emoji}</div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink/50">{a.cat}</div>
                    <span className="text-[10px] bg-mist/70 px-2 py-0.5 rounded-full border border-teal/20 text-ink/60">Coming soon</span>
                  </div>
                  <div className="font-display text-lg font-medium leading-tight">{a.title}</div>
                  <p className="text-xs text-ink/60 mt-2 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTINUING EDUCATION — honest empty state */}
        <section className="mb-14 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Continuing education</div>
          <h2 className="font-display text-3xl font-medium mb-6">Keeping your skills current</h2>
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-display text-xl font-medium mb-1">Nothing listed yet</h3>
            <p className="text-sm text-ink/60 max-w-lg mx-auto">
              We&rsquo;d rather show you nothing than a list of courses we haven&rsquo;t checked. When we
              find continuing-education options worth recommending to working caregivers, they&rsquo;ll
              show up here.
            </p>
          </div>
        </section>

        {/* COMMUNITY — honest coming state */}
        <section className="fade-up" style={{ animationDelay: '.15s' }}>
          <div className="bg-gradient-to-br from-sage/15 to-teal/10 border border-teal/20 rounded-3xl p-8 lg:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-3">Community</div>
              <h2 className="font-display text-3xl font-medium mb-3">You&rsquo;re not in this alone.</h2>
              <p className="text-sm text-ink/75 leading-relaxed max-w-md">
                We&rsquo;re planning local meetups and discussion spaces for Kindred caregivers. There
                aren&rsquo;t any events on the calendar yet, and we won&rsquo;t pretend otherwise.
              </p>
            </div>
            <div className="bg-cream border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Next meetup</div>
              <div className="font-display text-2xl font-medium">Not scheduled yet</div>
              <div className="text-sm text-ink/60 mt-1 mb-4">We&rsquo;ll post the first one here.</div>
              <Link
                href="/community"
                className="block w-full text-center bg-deepteal text-cream py-2.5 rounded-full text-sm hover:bg-inkdark transition"
              >
                What the community will include
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
