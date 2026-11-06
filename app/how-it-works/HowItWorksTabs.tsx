'use client';

/**
 * HowItWorksTabs — interactive tab switcher for /how-it-works.
 *
 * Shows ONE audience panel at a time (Families / Caregivers / Facilities) and
 * swaps on click — a carousel feel, not anchor scrolling. Re-keying the panel
 * on tab change replays the fade-up so the switch reads as a transition.
 */

import { useState } from 'react';
import Link from 'next/link';

type TabId = 'families' | 'caregivers' | 'facilities';

const TABS: { id: TabId; label: string }[] = [
  { id: 'families', label: 'For families' },
  { id: 'caregivers', label: 'For caregivers' },
  { id: 'facilities', label: 'For facilities' },
];

export function HowItWorksTabs() {
  const [active, setActive] = useState<TabId>('families');

  return (
    <>
      {/* Tab bar */}
      <section className="max-w-[1100px] mx-auto px-6 mb-12">
        <div className="flex items-center justify-center gap-2 sm:gap-8 border-b border-ink/10 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`py-3 px-2 text-sm sm:text-base border-b-2 transition -mb-px ${
                active === t.id
                  ? 'text-deepteal font-medium border-coral'
                  : 'text-ink/60 border-transparent hover:text-deepteal'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Active panel (keyed so the fade-up replays on switch) */}
      <div key={active} className="fade-up">
        {active === 'families' && <FamiliesPanel />}
        {active === 'caregivers' && <CaregiversPanel />}
        {active === 'facilities' && <FacilitiesPanel />}
      </div>
    </>
  );
}

/* -------------------------------- panels -------------------------------- */

function FamiliesPanel() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-12">
      <div className="text-center mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For families</div>
        <h2 className="font-display text-3xl md:text-4xl font-light">
          Finding care, in <span className="italic font-medium">four steps</span>
        </h2>
      </div>

      <div className="space-y-10">
        <Step n="1" title="Tell us about your loved one">
          <p className="text-ink/75 leading-relaxed">
            Browse caregivers directly, or share what kind of help you need, when, and anything a
            caregiver should know. The more you share, the better the match.
          </p>
        </Step>
        <Step n="2" title="Meet vetted caregivers">
          <p className="text-ink/75 leading-relaxed">
            Read bios, see specialties, and message anyone directly — no commitment. Every caregiver
            you see has already passed a real interview and full verification.
          </p>
        </Step>
        <Step n="3" title="Book a free meet-and-greet">
          <p className="text-ink/75 leading-relaxed">
            Most families do a quick video call first, then an in-person introduction before the
            first shift. Chemistry matters — and we&apos;ve never charged anyone for figuring out if
            it&apos;s there.
          </p>
        </Step>
        <Step n="4" title="Care begins. We handle the paperwork.">
          <p className="text-ink/75 leading-relaxed mb-3">
            Care happens on your schedule, and payment is processed securely through Kindred so you
            get clear receipts. The relationship is yours — the admin is ours.
          </p>
          <Link href="/pricing" className="text-sm text-deepteal hover:text-coral font-medium">See pricing →</Link>
        </Step>
      </div>

      <div className="mt-12 text-center">
        <Link href="/browse" className="inline-flex bg-deepteal text-cream px-7 py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
          Browse caregivers →
        </Link>
      </div>
    </section>
  );
}

function CaregiversPanel() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-12">
      <div className="text-center mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For caregivers</div>
        <h2 className="font-display text-3xl md:text-4xl font-light">
          Build your own caregiving practice, on <span className="italic font-medium">your terms</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Card n="1" title="Apply in a few minutes">
          Send your resume, a few details, and answer one question on a short video — or just your
          voice. That&apos;s the whole application.
        </Card>
        <Card n="2" title="Talk to a real human">
          Every caregiver has a real conversation with us before we ever run the expensive checks —
          Level 2 background, license verification, CPR, and references. The interview is the gate,
          not a form.
        </Card>
        <Card n="3" title="Set your rate. Get matched.">
          Build your profile, set your own rate and schedule, and choose who you work with. Families
          message you directly — you keep the rate you set, with no agency taking the bigger half.
        </Card>
      </div>

      <div className="mt-12 text-center">
        <Link href="/apply" className="inline-flex bg-deepteal text-cream px-7 py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
          Start your application →
        </Link>
      </div>
    </section>
  );
}

function FacilitiesPanel() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-12">
      <div className="text-center mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For facilities</div>
        <h2 className="font-display text-3xl md:text-4xl font-light">
          A better way to staff, <span className="italic font-medium text-gradient">coming after launch.</span>
        </h2>
        <p className="text-ink/70 mt-4 max-w-2xl mx-auto">
          We&apos;re building Kindred for families and caregivers first. The facilities side — for
          assisted living, skilled nursing, and memory care — comes next. Here&apos;s what
          we&apos;re building toward.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-ink/10 rounded-2xl p-7">
          <div className="text-3xl mb-3">🏥</div>
          <h3 className="font-display text-xl font-medium mb-3">The vision for facilities</h3>
          <p className="text-sm text-ink/75 leading-relaxed mb-4">
            Build a private roster of vetted CNAs who know your facility, post shifts to them first,
            and escalate to the wider marketplace only when you need broader coverage — on a single
            monthly invoice, with no agency markup.
          </p>
          <Link href="/contact" className="text-sm text-deepteal hover:text-coral font-medium">Interested in early access? Talk to us →</Link>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-7">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-display text-xl font-medium mb-3">What we&apos;re planning</h3>
          <ul className="space-y-3 text-sm text-ink/80">
            <li><strong>Roster + open marketplace</strong> — your trusted CNAs see shifts first; a broader pool covers the gaps.</li>
            <li><strong>Auto-approval rules</strong> — clean timesheets approve themselves; only flagged shifts come to you.</li>
            <li><strong>Auto-escalation</strong> — unfilled shifts can raise their rate within a ceiling you set.</li>
            <li><strong>Clear reporting</strong> — fill rate, cost-per-hour, and no-show trends in exports you can actually use.</li>
            <li><strong>Net-30 monthly billing</strong> — one invoice, not per-hour chaos.</li>
          </ul>
          <p className="text-xs text-ink/55 mt-4">These are on the roadmap, not live yet — we&apos;ll say so plainly until they are.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- helpers -------------------------------- */

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-12 gap-6 items-start">
      <div className="md:col-span-1 flex justify-start">
        <div className="w-12 h-12 rounded-full bg-kindred-gradient text-cream flex items-center justify-center font-display text-xl font-medium">{n}</div>
      </div>
      <div className="md:col-span-11">
        <h3 className="font-display text-2xl font-medium mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Card({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-ink/10 rounded-2xl p-6">
      <div className="w-12 h-12 rounded-full bg-kindred-gradient text-cream flex items-center justify-center font-display text-xl font-medium mb-4">{n}</div>
      <h3 className="font-display text-xl font-medium mb-2">{title}</h3>
      <p className="text-sm text-ink/75 leading-relaxed">{children}</p>
    </div>
  );
}
