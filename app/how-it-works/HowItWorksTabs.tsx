'use client';

/**
 * HowItWorksTabs — interactive tab switcher for /how-it-works.
 *
 * Two audiences only: families and caregivers. Kindred is in-home care only
 * (Nov 2026): no facilities, no staffing. The facility HTML mocks stay in
 * Front-End/Business-Portal for reference but are not part of the product.
 *
 * Copy follows the platform model: Kindred connects people and then gets out
 * of the way. It does not process care payments, employ caregivers, or handle
 * paperwork between families and caregivers.
 */

import { useState } from 'react';
import Link from 'next/link';

type TabId = 'families' | 'caregivers';

const TABS: { id: TabId; label: string }[] = [
  { id: 'families', label: 'For families' },
  { id: 'caregivers', label: 'For caregivers' },
];

export function HowItWorksTabs() {
  const [active, setActive] = useState<TabId>('families');

  return (
    <>
      <section className="max-w-[1100px] mx-auto px-6 mb-12">
        <div role="tablist" className="flex items-center justify-center gap-2 sm:gap-8 border-b border-ink/10 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
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

      <div key={active} className="fade-up">
        {active === 'families' ? <FamiliesPanel /> : <CaregiversPanel />}
      </div>
    </>
  );
}

function FamiliesPanel() {
  return (
    <section className="max-w-[1100px] mx-auto px-6 pb-12">
      <div className="text-center mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">For families</div>
        <h2 className="font-display text-3xl md:text-4xl font-light">
          Finding care at home, in <span className="italic font-medium">four steps</span>
        </h2>
      </div>

      <div className="space-y-10">
        <Step n="1" title="Browse for free">
          <p className="text-ink/75 leading-relaxed">
            See real caregivers near you before you pay anything: their experience, the kinds of care
            they provide, the languages they speak and the rate they charge. Every one of them meets
            the{' '}
            <Link href="/kindred-standard" className="text-deepteal underline decoration-sage underline-offset-4">
              Kindred Standard
            </Link>
            .
          </p>
        </Step>
        <Step n="2" title="Join to unlock names and messaging">
          <p className="text-ink/75 leading-relaxed">
            To protect caregivers&apos; privacy, full names, photos and messaging open up with a family
            membership. You can also post what you need and let caregivers come to you.
          </p>
        </Step>
        <Step n="3" title="Talk to them before you choose">
          <p className="text-ink/75 leading-relaxed">
            Message, set up a call, meet in person. Ask whatever matters to you. Talk to as many
            caregivers as you like. Chemistry matters, and you&apos;re the one who decides who comes into
            your home.
          </p>
        </Step>
        <Step n="4" title="Hire them directly">
          <p className="text-ink/75 leading-relaxed mb-3">
            You and your caregiver agree on the schedule, the work and the rate, and you pay them
            directly. Kindred isn&apos;t the employer and never takes a cut of what you pay them.
          </p>
          <Link href="/pricing" className="text-sm text-deepteal hover:text-coral font-medium">
            See membership pricing →
          </Link>
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
          Work in home care, on <span className="italic font-medium">your terms</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Card n="1" title="Apply in a few minutes">
          Send your resume, a few details, and answer one question on a short video, or just your
          voice. Kindred is for experienced caregivers: you&apos;ll need at least 1,500 hours of
          hands-on care.
        </Card>
        <Card n="2" title="Meet the Kindred Standard">
          A personal interview with us, then your Level 2 background check, a verified ID and proof
          of your own liability insurance. Once all of it is in, families can find you.
        </Card>
        <Card n="3" title="Set your rate. Keep all of it.">
          Choose your rate, your hours, your area and the families you work with. Families pay you
          directly. No agency taking the bigger half, and no cut from Kindred.
        </Card>
      </div>

      <div className="mt-8 bg-butter/40 border border-butter rounded-2xl p-5 text-center text-sm text-deepteal font-medium max-w-2xl mx-auto">
        Our first 25 approved caregivers get a full year of membership free, startup fee included.
      </div>

      <div className="mt-10 text-center">
        <Link href="/apply" className="inline-flex bg-deepteal text-cream px-7 py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
          Start your application →
        </Link>
      </div>
    </section>
  );
}

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
