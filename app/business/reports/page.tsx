/**
 * /business/reports — analytics. Ported from Business-Portal/reports.html.
 * Shell lives in app/business/layout.tsx.
 *
 * Real-data-only: KPIs (fill rate, total hours, cost/hr, no-show rate), the
 * monthly-spend bars, and the top-caregivers leaderboard are all computed from
 * this org's real business_shifts + timesheets + invoices. When there isn't
 * enough history to be meaningful, we show an honest "not enough data yet"
 * state rather than the mock's fabricated 6-month charts. Export buttons render
 * for visual parity.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/business';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

export default async function BusinessReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await getBusinessContext();
  if (!ctx?.orgId) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Reports &amp; analytics</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            The numbers your <span className="italic font-medium text-gradient">CFO will ask about.</span>
          </h1>
        </section>
        <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
          <p className="text-sm text-ink/70">Set up your facility and run some shifts to unlock analytics.</p>
        </div>
      </main>
    );
  }

  // Pull all shifts for this org (with status + rates).
  const { data: shiftRows } = await supabase
    .from('business_shifts')
    .select('id, shift_date, start_time, end_time, status, bill_rate_cents, assigned_cna_id')
    .eq('org_id', ctx.orgId);
  const shifts = shiftRows ?? [];

  const totalShifts = shifts.length;
  const filledShifts = shifts.filter((s) => ['assigned', 'in_progress', 'completed'].includes(s.status)).length;
  const noShows = shifts.filter((s) => s.status === 'no_show').length;
  const fillPct = totalShifts > 0 ? Math.round((filledShifts / totalShifts) * 100) : null;
  const noShowPct = totalShifts > 0 ? ((noShows / totalShifts) * 100).toFixed(1) : null;

  // Hours + cost from approved timesheets.
  const shiftIds = shifts.map((s) => s.id);
  let totalHours = 0;
  let totalCostCents = 0;
  const cnaHours = new Map<string, { hours: number; cents: number; shifts: number }>();
  if (shiftIds.length > 0) {
    const { data: ts } = await supabase
      .from('timesheets')
      .select('shift_id, cna_id, hours_worked, status')
      .in('shift_id', shiftIds)
      .eq('status', 'approved');
    const billByShift = new Map(shifts.map((s) => [s.id, s.bill_rate_cents]));
    (ts ?? []).forEach((t) => {
      const hrs = Number(t.hours_worked ?? 0);
      const bill = billByShift.get(t.shift_id) ?? 0;
      totalHours += hrs;
      totalCostCents += Math.round(hrs * bill);
      const entry = cnaHours.get(t.cna_id) ?? { hours: 0, cents: 0, shifts: 0 };
      entry.hours += hrs;
      entry.cents += Math.round(hrs * bill);
      entry.shifts += 1;
      cnaHours.set(t.cna_id, entry);
    });
  }
  const avgCostPerHourCents = totalHours > 0 ? Math.round(totalCostCents / totalHours) : null;

  // Monthly spend from invoices (real history).
  const { data: invoices } = await supabase
    .from('invoices')
    .select('period_end, total_cents, status')
    .eq('org_id', ctx.orgId)
    .order('period_end', { ascending: true });
  const monthlySpend = (invoices ?? []).map((i) => ({
    label: new Date(i.period_end).toLocaleDateString('en-US', { month: 'short' }),
    cents: i.total_cents,
  }));
  const maxSpend = Math.max(1, ...monthlySpend.map((m) => m.cents));

  // Top caregivers leaderboard.
  const topCnaIds = Array.from(cnaHours.entries())
    .sort((a, b) => b[1].hours - a[1].hours)
    .slice(0, 5)
    .map(([id]) => id);
  const cnaNames = new Map<string, { name: string; rating: number | null }>();
  if (topCnaIds.length > 0) {
    const { data: cnas } = await supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name, rating_avg')
      .in('user_id', topCnaIds);
    (cnas ?? []).forEach((c) =>
      cnaNames.set(c.user_id, { name: `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`, rating: c.rating_avg }),
    );
  }

  const hasData = totalShifts > 0;

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12">
      {/* HEADER */}
      <section className="mb-8 fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Reports &amp; analytics</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            The numbers your <span className="italic font-medium text-gradient">CFO will ask about.</span>
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            Fill rate, cost-per-hour, and spend trends — computed from your real shift and timesheet
            history.
          </p>
        </div>
        <button className="hidden sm:inline-flex bg-deepteal text-cream px-4 py-2 rounded-full text-sm hover:bg-inkdark transition">
          📊 Export PDF
        </button>
      </section>

      {!hasData ? (
        <section className="fade-up" style={{ animationDelay: '.1s' }}>
          <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-12 text-center">
            <div className="text-3xl mb-3">📊</div>
            <h2 className="font-display text-2xl font-medium mb-2">Not enough data yet</h2>
            <p className="text-sm text-ink/60 max-w-md mx-auto mb-5">
              Once you've posted shifts and caregivers have worked them, this page fills with fill-rate
              trends, cost-per-hour, your top caregivers, and CFO-ready exports.
            </p>
            <Link href="/business/post-shifts" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Post shifts →
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* KPI CARDS */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-10 fade-up" style={{ animationDelay: '.1s' }}>
            <div className="metric-card bg-white border border-ink/10 rounded-2xl p-5">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Fill rate</div>
              <div className="font-display text-4xl font-medium mt-1">{fillPct != null ? fillPct : '—'}<span className="text-xl">%</span></div>
              <div className="text-xs text-ink/60 mt-1">{filledShifts} of {totalShifts} shifts</div>
            </div>
            <div className="metric-card bg-white border border-ink/10 rounded-2xl p-5">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Cost per hour</div>
              <div className="font-display text-4xl font-medium mt-1">{avgCostPerHourCents != null ? formatCents(avgCostPerHourCents) : '—'}</div>
              <div className="text-xs text-ink/60 mt-1">Blended bill rate</div>
            </div>
            <div className="metric-card bg-white border border-ink/10 rounded-2xl p-5">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Total hours</div>
              <div className="font-display text-4xl font-medium mt-1">{totalHours.toFixed(0)}</div>
              <div className="text-xs text-ink/60 mt-1">Approved &amp; billed</div>
            </div>
            <div className="metric-card bg-white border border-ink/10 rounded-2xl p-5">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">No-show rate</div>
              <div className="font-display text-4xl font-medium mt-1">{noShowPct ?? '0.0'}<span className="text-xl">%</span></div>
              <div className="text-xs text-ink/60 mt-1">{noShows} of {totalShifts}</div>
            </div>
          </section>

          {/* MONTHLY SPEND + LEADERBOARD */}
          <section className="grid lg:grid-cols-3 gap-6 mb-10 fade-up" style={{ animationDelay: '.15s' }}>
            {/* Monthly spend bars */}
            <div className="lg:col-span-2 bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Monthly spend</div>
              <h3 className="font-display text-xl font-medium mb-5">Billed by month</h3>
              {monthlySpend.length > 0 ? (
                <div className="flex items-end gap-3 h-48">
                  {monthlySpend.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
                      <div className="text-[10px] font-mono text-deepteal">{formatCents(m.cents, { showFraction: false })}</div>
                      <div
                        className="w-full report-bar"
                        style={{ height: `${Math.max(6, (m.cents / maxSpend) * 100)}%` }}
                      />
                      <div className="text-[10px] font-mono text-ink/50">{m.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/50 py-8 text-center">
                  No invoices generated yet — spend trends appear after your first monthly invoice.
                </p>
              )}
            </div>

            {/* Top caregivers */}
            <div className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Top caregivers</div>
              <h3 className="font-display text-xl font-medium mb-5">Who's filling your shifts</h3>
              {topCnaIds.length > 0 ? (
                <div className="space-y-3">
                  {topCnaIds.map((id, idx) => {
                    const info = cnaNames.get(id);
                    const name = info?.name ?? 'Caregiver';
                    const stats = cnaHours.get(id)!;
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 bg-mist/40 rounded-xl">
                        <div className="font-display text-2xl font-medium text-ink/40 w-6 text-center">{idx + 1}</div>
                        <div className={`w-10 h-10 rounded-full ${avatarClass(name)} flex items-center justify-center text-cream text-xs font-medium`}>
                          {initials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="text-xs text-ink/60 font-mono">
                            {info?.rating != null ? `★ ${Number(info.rating).toFixed(1)} · ` : ''}{stats.shifts} shifts
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-medium">{stats.hours.toFixed(0)} hrs</div>
                          <div className="text-[10px] text-ink/60 font-mono">{formatCents(stats.cents, { showFraction: false })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-ink/50 py-8 text-center">
                  No completed shifts yet. Your most active caregivers will rank here.
                </p>
              )}
              <Link href="/business/roster" className="block mt-4 text-center text-xs text-deepteal hover:text-coral">
                View full roster →
              </Link>
            </div>
          </section>

          {/* EXPORT CTA */}
          <section className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
            <div className="bg-creamdark/70 border border-ink/10 rounded-3xl p-6 lg:p-8 grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">📊 Board-ready exports</div>
                <h3 className="font-display text-2xl font-medium mb-2">Export anything you see here.</h3>
                <p className="text-sm text-ink/70 leading-relaxed">
                  PDF for board packets, CSV for your own analysis, or schedule a monthly auto-export to
                  your CFO. Coming soon.
                </p>
              </div>
              <div className="lg:col-span-5 grid grid-cols-3 gap-2">
                <div className="bg-white border border-ink/10 rounded-2xl p-4 flex flex-col items-center gap-1 opacity-70">
                  <span className="text-2xl">📄</span><div className="text-xs font-medium">PDF</div>
                </div>
                <div className="bg-white border border-ink/10 rounded-2xl p-4 flex flex-col items-center gap-1 opacity-70">
                  <span className="text-2xl">📊</span><div className="text-xs font-medium">CSV</div>
                </div>
                <div className="bg-white border border-ink/10 rounded-2xl p-4 flex flex-col items-center gap-1 opacity-70">
                  <span className="text-2xl">📧</span><div className="text-xs font-medium">Schedule</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
