'use client';

/**
 * Payout-speed selector — the click-to-select cards from the earnings mock.
 * Client component for the interaction. Pure UI for now (no save wired yet).
 */

import { useState } from 'react';

type Option = 'weekly' | 'next_day' | 'instant';

export function PayoutOptions() {
  const [selected, setSelected] = useState<Option>('weekly');

  const baseCard =
    'payout-option relative bg-white border-2 rounded-2xl p-6 cursor-pointer transition';
  const cls = (opt: Option, extra = '') =>
    `${baseCard} ${selected === opt ? 'selected border-deepteal' : 'border-ink/10'} ${extra}`;

  return (
    <>
      <div className="grid md:grid-cols-3 gap-4">
        {/* Weekly / Free */}
        <div className={cls('weekly')} onClick={() => setSelected('weekly')}>
          <div className="text-2xl mb-3">🗓️</div>
          <div className="font-display text-xl font-medium mb-1">Weekly auto-deposit</div>
          <div className="text-xs text-deepteal font-mono uppercase tracking-widest mb-3">
            Free · Recommended
          </div>
          <div className="text-sm text-ink/75 leading-relaxed mb-4">
            Every Monday morning, your previous week&rsquo;s earnings land in your bank account.
            No fees, no thinking required.
          </div>
          <div className="text-xs space-y-1 pt-4 border-t border-ink/10">
            <div className="flex justify-between">
              <span className="text-ink/60">Fee</span>
              <span className="font-mono font-medium">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Speed</span>
              <span className="font-mono">1–2 days</span>
            </div>
          </div>
        </div>

        {/* Next-day */}
        <div className={cls('next_day')} onClick={() => setSelected('next_day')}>
          <div className="text-2xl mb-3">📨</div>
          <div className="font-display text-xl font-medium mb-1">Next-day payout</div>
          <div className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-3">Small fee</div>
          <div className="text-sm text-ink/75 leading-relaxed mb-4">
            Cash out same-day after a shift completes. Hits your account next business day.
            Standard ACH transfer.
          </div>
          <div className="text-xs space-y-1 pt-4 border-t border-ink/10">
            <div className="flex justify-between">
              <span className="text-ink/60">Fee</span>
              <span className="font-mono font-medium">$0.50 per cash-out</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Speed</span>
              <span className="font-mono">~24 hrs</span>
            </div>
          </div>
        </div>

        {/* Instant */}
        <div className={cls('instant', 'overflow-hidden')} onClick={() => setSelected('instant')}>
          <div className="absolute -top-2 right-3 bg-coral text-cream text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-b-md">
            ⚡ Fastest
          </div>
          <div className="text-2xl mb-3 mt-3">⚡</div>
          <div className="font-display text-xl font-medium mb-1">Instant payout</div>
          <div className="text-xs text-coral font-mono uppercase tracking-widest mb-3">
            For when you need it now
          </div>
          <div className="text-sm text-ink/75 leading-relaxed mb-4">
            Get paid within minutes to your debit card. Use this when you&rsquo;ve got a bill due
            tonight or rent in the morning.
          </div>
          <div className="text-xs space-y-1 pt-4 border-t border-ink/10">
            <div className="flex justify-between">
              <span className="text-ink/60">Fee</span>
              <span className="font-mono font-medium">1.5% (min $0.50)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Speed</span>
              <span className="font-mono">Under 30 min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-mist/40 border border-teal/20 rounded-xl p-4 text-xs text-ink/70 leading-relaxed flex items-start gap-3">
        <span className="text-base">💡</span>
        <div>
          <strong className="text-ink">How the fees compare:</strong> on $312, instant payout costs
          $4.69 (1.5%). Next-day is $0.50. The auto-weekly is free forever. Stripe processes all of
          these — Kindred doesn&rsquo;t take any of the fee.
        </div>
      </div>
    </>
  );
}
