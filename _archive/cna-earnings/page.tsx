/**
 * /cna/earnings — caregiver earnings & payouts. Ported 1:1 from
 * CNA-Portal/earnings.html.
 *
 * DATA NOTE: There is no payments/payouts/transactions system wired yet
 * (Stripe Connect + the payments tables exist in schema but aren't populated).
 * Per the session data policy ("real data where it exists, mock-style filler
 * elsewhere"), this page renders the full mock design using realistic STATIC
 * filler for all financial figures. Every filler block is marked FILLER below.
 * When the payments system is wired, swap the filler for live queries.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PayoutOptions } from '@/components/cna/PayoutOptions';

export const dynamic = 'force-dynamic';

// ---- FILLER DATA (no payments system yet) ----------------------------------
const WEEKLY_BARS = [
  { label: 'Mar 17', amount: '$420', height: '53%', cls: 'from-mist to-mist/50' },
  { label: 'Mar 24', amount: '$520', height: '65%', cls: 'from-sage/40 to-mist' },
  { label: 'Mar 31', amount: '$610', height: '76%', cls: 'from-sage/60 to-sage/30' },
  { label: 'Apr 7', amount: '$580', height: '73%', cls: 'from-sage/60 to-sage/30' },
  { label: 'Apr 14', amount: '$660', height: '82%', cls: 'from-teal/60 to-sage/40' },
  { label: 'Apr 21', amount: '$724', height: '90%', cls: 'from-teal/70 to-sage/50' },
  { label: 'Apr 28', amount: '$680', height: '85%', cls: 'from-teal/70 to-sage/50' },
  { label: 'This wk', amount: '$624 ↑', height: '78%', cls: 'from-coral to-butter', highlight: true },
];

const RECENT_SHIFTS = [
  { date: 'May 15 · Fri', sub: 'On shift now', subCls: 'text-coral font-mono', client: 'Eleanor K.', clientNote: '(Sarah)', av: 'av-2', initials: 'EK', hours: '4.0', gross: '$118.40', fee: '-12%', net: '$104.00' },
  { date: 'May 14 · Thu', sub: '9 AM – 1 PM', client: 'Margaret P.', av: 'av-6', initials: 'MP', hours: '4.0', gross: '$118.40', fee: '-12%', net: '$104.00' },
  { date: 'May 13 · Wed', sub: '9 AM – 1 PM', client: 'Eleanor K.', av: 'av-2', initials: 'EK', hours: '4.0', gross: '$118.40', fee: '-12%', net: '$104.00' },
  { date: 'May 12 · Tue', sub: '9 AM – 1 PM', client: 'Margaret P.', av: 'av-6', initials: 'MP', hours: '4.0', gross: '$118.40', fee: '-12%', net: '$104.00' },
];

const INCOME_BY_CLIENT = [
  { name: 'Eleanor K. (Sarah)', amount: '$4,160 · 160 hrs', width: '49%', av: 'av-2', initials: 'EK', bar: 'from-sage to-teal' },
  { name: 'Margaret P.', amount: '$2,860 · 110 hrs', width: '34%', av: 'av-6', initials: 'MP', bar: 'from-teal to-sky' },
  { name: 'Harold M.', amount: '$1,040 · 40 hrs', width: '12%', av: 'av-1', initials: 'HM', bar: 'from-sky to-deepteal' },
  { name: '2 past clients', amount: '$360 · 14 hrs', width: '5%', av: 'av-5', initials: '+2', bar: 'bg-mist/50' },
];
// ----------------------------------------------------------------------------

export default async function CnaEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // (Real profile fetched for future use — rate, tier — but the financial
  // figures below are filler until the payments system is wired.)
  await supabase.from('cna_profiles').select('hourly_rate_cents, tier').eq('user_id', user.id).maybeSingle();

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-10 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Money</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Your <span className="italic font-medium text-gradient">earnings</span>, on your terms.
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Get paid weekly for free, or cash out anytime for a small fee. Either way, every dollar
          is tracked.
        </p>
      </section>

      {/* TOP HERO */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* BIG NUMBER CARD — FILLER */}
          <div className="lg:col-span-2 bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl p-8 lg:p-10 relative overflow-hidden grain">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cream/10 blur-3xl" />
            <div className="relative">
              <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-2">
                Available to cash out
              </div>
              <div className="font-display text-7xl lg:text-8xl font-light leading-none">
                $<span className="font-medium">312</span>
                <span className="text-3xl font-light">.40</span>
              </div>
              <div className="text-cream/85 mt-3 max-w-md">
                From 12 hours worked this week with Eleanor K. and Margaret P. Auto-deposits free on
                Monday — or get it now for $4.69.
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="bg-cream text-deepteal px-6 py-3 rounded-full text-sm font-medium hover:bg-cream/90 transition flex items-center gap-2">
                  ⚡ Cash out instantly · $4.69 fee
                </button>
                <button className="border border-cream/40 text-cream px-6 py-3 rounded-full text-sm hover:bg-cream/10 transition">
                  Wait until Mon · free
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-cream/15 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/70 mb-1">This month</div>
                  <div className="font-display text-2xl font-medium">$1,248</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/70 mb-1">YTD 2026</div>
                  <div className="font-display text-2xl font-medium">$8,420</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/70 mb-1">Hours YTD</div>
                  <div className="font-display text-2xl font-medium">317</div>
                </div>
              </div>
            </div>
          </div>

          {/* PAYOUT METHOD CARD — FILLER */}
          <div className="space-y-4">
            <div className="bg-white border border-ink/10 rounded-2xl p-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Auto-deposit</div>
              <div className="font-display text-xl font-medium">Every Monday</div>
              <div className="text-sm text-ink/60 mt-1">Free · 1–2 business days</div>
              <div className="border-t border-ink/10 mt-4 pt-4 flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-gradient-to-br from-sky to-deepteal flex items-center justify-center text-cream text-[9px] font-bold">
                  ACH
                </div>
                <div className="text-xs">
                  <div className="font-medium">Chase ••• 7821</div>
                  <div className="text-ink/60">Checking</div>
                </div>
                <button className="ml-auto text-xs text-deepteal hover:text-coral">Change</button>
              </div>
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Next free payout</div>
              <div className="font-display text-xl font-medium">Mon, May 18</div>
              <div className="text-sm text-ink/60 mt-1">3 days · $312.40 + tomorrow&rsquo;s shift</div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYOUT OPTIONS (interactive) */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.15s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Payout speed</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">How do you want to get paid?</h2>
          </div>
          <button className="text-sm text-deepteal hover:text-coral transition">Save as default →</button>
        </div>
        <PayoutOptions />
      </section>

      {/* WEEKLY CHART — FILLER */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.2s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Last 8 weeks</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Earnings trend</h2>
          </div>
          <select className="text-sm bg-white border border-ink/15 rounded-full px-4 py-2 focus:outline-none focus:border-teal">
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Quarterly</option>
          </select>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8">
          <div className="flex items-end justify-between gap-3 h-64">
            {WEEKLY_BARS.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div className={`text-[10px] font-mono ${b.highlight ? 'text-coral font-medium' : 'text-ink/50'}`}>
                  {b.amount}
                </div>
                <div className={`bar w-full rounded-t-xl bg-gradient-to-t ${b.cls}`} style={{ height: b.height }} />
                <div className={`text-[10px] font-mono ${b.highlight ? 'text-coral font-medium' : 'text-ink/50'}`}>
                  {b.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-ink/10 grid sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-ink/60 mb-1">Avg weekly</div>
              <div className="font-display text-2xl font-medium">$602</div>
            </div>
            <div>
              <div className="text-xs text-ink/60 mb-1">Best week</div>
              <div className="font-display text-2xl font-medium">$724</div>
            </div>
            <div>
              <div className="text-xs text-ink/60 mb-1">Avg hours</div>
              <div className="font-display text-2xl font-medium">23</div>
            </div>
            <div>
              <div className="text-xs text-ink/60 mb-1">Trend</div>
              <div className="font-display text-2xl font-medium text-sage">↑ 12%</div>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT SHIFTS — FILLER */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.25s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Transactions</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Recent shifts</h2>
          </div>
          <div className="flex gap-2">
            <select className="text-sm bg-white border border-ink/15 rounded-full px-4 py-2 focus:outline-none focus:border-teal">
              <option>Last 30 days</option>
              <option>This year</option>
            </select>
            <button className="text-sm bg-white border border-ink/15 rounded-full px-4 py-2 hover:bg-mist transition">
              ↓ Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
            <div className="col-span-3">Shift</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2 text-right">Hours</div>
            <div className="col-span-2 text-right">Gross</div>
            <div className="col-span-1 text-right">Fee</div>
            <div className="col-span-1 text-right">You earn</div>
          </div>

          {RECENT_SHIFTS.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 text-sm border-b border-ink/10 hover:bg-mist/40 transition items-center">
              <div className="col-span-3">
                <div className="font-medium">{s.date}</div>
                <div className={`text-xs ${s.subCls ?? 'text-ink/60'}`}>{s.sub}</div>
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full ${s.av} flex items-center justify-center text-cream text-xs font-medium`}>
                  {s.initials}
                </div>
                <span>
                  {s.client}{' '}
                  {s.clientNote && <span className="text-xs text-ink/50">{s.clientNote}</span>}
                </span>
              </div>
              <div className="col-span-2 text-right font-mono">{s.hours}</div>
              <div className="col-span-2 text-right font-mono text-ink/70">{s.gross}</div>
              <div className="col-span-1 text-right font-mono text-ink/50">{s.fee}</div>
              <div className="col-span-1 text-right font-mono font-medium">{s.net}</div>
            </div>
          ))}

          {/* Payout row */}
          <div className="grid grid-cols-12 gap-4 px-5 py-4 text-sm border-b border-ink/10 hover:bg-mist/40 transition items-center bg-mist/20">
            <div className="col-span-3">
              <div className="font-medium text-deepteal">May 11 · Mon</div>
              <div className="text-xs text-ink/60">Auto-payout</div>
            </div>
            <div className="col-span-3 flex items-center gap-2 text-ink/60">
              <span className="text-base">🏦</span>
              <span>Chase ••• 7821</span>
            </div>
            <div className="col-span-2 text-right font-mono text-ink/40">—</div>
            <div className="col-span-2 text-right font-mono text-ink/40">—</div>
            <div className="col-span-1 text-right font-mono text-ink/40">$0.00</div>
            <div className="col-span-1 text-right font-mono font-medium text-deepteal">+$412.00</div>
          </div>

          <div className="px-5 py-3 bg-mist/30 border-t border-ink/10 grid grid-cols-12 gap-4 items-center text-sm">
            <div className="col-span-9 text-right font-medium">May subtotal</div>
            <div className="col-span-2 text-right" />
            <div className="col-span-1 text-right font-mono font-medium">$624.00</div>
          </div>
        </div>

        <div className="text-center mt-4">
          <button className="text-sm text-deepteal hover:text-coral">Show all transactions →</button>
        </div>
      </section>

      {/* TAX DOCS + INCOME BY CLIENT — FILLER */}
      <section className="grid lg:grid-cols-3 gap-6 fade-up" style={{ animationDelay: '.3s' }}>
        <div className="lg:col-span-2 bg-white border border-ink/10 rounded-2xl p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">2026 YTD</div>
          <h3 className="font-display text-xl font-medium mb-5">Income by client</h3>
          <div className="space-y-4">
            {INCOME_BY_CLIENT.map((c) => (
              <div key={c.name}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full ${c.av} flex items-center justify-center text-cream text-xs font-medium`}>
                    {c.initials}
                  </div>
                  <div className="flex-1 flex justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-mono">{c.amount}</span>
                  </div>
                </div>
                <div className="h-2 bg-mist rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.bar.startsWith('bg-') ? c.bar : `bg-gradient-to-r ${c.bar}`}`}
                    style={{ width: c.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Tax season</div>
          <h3 className="font-display text-xl font-medium mb-2">Your 1099-NEC</h3>
          <p className="text-sm text-ink/70 leading-relaxed mb-5">
            As a 1099 contractor, you get a year-end summary. Past forms below — current year ready
            in January.
          </p>
          <div className="space-y-2">
            <div className="bg-cream border border-ink/10 rounded-xl p-4 flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div className="flex-1">
                <div className="font-medium text-sm">2025 1099-NEC</div>
                <div className="text-xs text-ink/60 font-mono">$18,420 total</div>
              </div>
              <button className="text-xs text-deepteal hover:text-coral">↓ PDF</button>
            </div>
            <div className="bg-cream border border-ink/10 rounded-xl p-4 flex items-center gap-3 opacity-60">
              <div className="text-2xl">⏳</div>
              <div className="flex-1">
                <div className="font-medium text-sm">2026 1099-NEC</div>
                <div className="text-xs text-ink/60">Ready in Jan 2027</div>
              </div>
            </div>
          </div>
          <Link href="/cna/resources" className="block mt-4 text-center text-xs text-deepteal hover:text-coral">
            Tax tips for 1099 caregivers →
          </Link>
        </div>
      </section>
    </main>
  );
}
