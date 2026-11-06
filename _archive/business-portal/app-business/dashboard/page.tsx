/**
 * /business/dashboard — the facility home view. Ported from
 * Business-Portal/dashboard.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only (per the porting policy): coverage stats, the live shift
 * board, applications-to-review, the invoice preview, and roster count all come
 * from real tables for THIS facility (`business_shifts`,
 * `business_shift_applications`, `invoices`, `approved_roster`). Where there's
 * no data yet, we render explicit empty states rather than the mock's
 * "7 of 10 / $18.4k / Magnolia Springs" filler. If the user isn't linked to an
 * org, we show a setup nudge.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext, SHIFT_STATUS_META, formatShiftTime } from '@/lib/business';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

export default async function BusinessDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('users').select('full_name').eq('id', user.id).single();
  const firstName = (me?.full_name ?? 'there').split(' ')[0];

  const ctx = await getBusinessContext();
  const orgId = ctx?.orgId ?? null;

  // No org linked yet → setup nudge (keeps the shell + nav intact).
  if (!orgId) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Welcome</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Good to see you, {firstName}.
          </h1>
        </section>
        <section className="fade-up" style={{ animationDelay: '.1s' }}>
          <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="font-display text-2xl font-medium mb-2">Finish setting up your facility</h2>
            <p className="text-sm text-ink/70 max-w-md mx-auto mb-5">
              We need a few details about your organization before you can post shifts — license, EIN,
              and insurance certificate. Once that's done, your shift board lights up here.
            </p>
            <Link href="/business/settings" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Start facility setup →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ---- Today's shifts -------------------------------------------------------
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const { data: todayShifts } = await supabase
    .from('business_shifts')
    .select('id, start_time, end_time, services_required, bill_rate_cents, status, assigned_cna_id, notes, requires_dementia_cert')
    .eq('org_id', orgId)
    .eq('shift_date', todayStr)
    .order('start_time', { ascending: true });

  const shifts = todayShifts ?? [];
  const filledCount = shifts.filter((s) => ['assigned', 'in_progress', 'completed'].includes(s.status)).length;
  const openCount = shifts.filter((s) => s.status === 'open').length;

  // Names for assigned CNAs.
  const assignedIds = Array.from(new Set(shifts.map((s) => s.assigned_cna_id).filter(Boolean))) as string[];
  const cnaNames = new Map<string, { name: string; rating: number | null }>();
  if (assignedIds.length > 0) {
    const { data: cnas } = await supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name, rating_avg')
      .in('user_id', assignedIds);
    (cnas ?? []).forEach((c) =>
      cnaNames.set(c.user_id, {
        name: `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`,
        rating: c.rating_avg,
      }),
    );
  }

  // ---- Applications awaiting review ----------------------------------------
  const { data: openShiftIds } = await supabase
    .from('business_shifts')
    .select('id')
    .eq('org_id', orgId)
    .eq('status', 'open');
  const openIds = (openShiftIds ?? []).map((s) => s.id);

  let pendingApps: Array<{ id: string; cna_id: string; shift_id: string; created_at: string }> = [];
  if (openIds.length > 0) {
    const { data } = await supabase
      .from('business_shift_applications')
      .select('id, cna_id, shift_id, created_at')
      .in('shift_id', openIds)
      .eq('status', 'submitted')
      .order('created_at', { ascending: false })
      .limit(4);
    pendingApps = data ?? [];
  }
  const { count: totalAppCount } = await supabase
    .from('business_shift_applications')
    .select('id', { count: 'exact', head: true })
    .in('shift_id', openIds.length > 0 ? openIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'submitted');

  const appCnaIds = Array.from(new Set(pendingApps.map((a) => a.cna_id)));
  const appCnaInfo = new Map<string, { name: string; rating: number | null }>();
  if (appCnaIds.length > 0) {
    const { data: cnas } = await supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name, rating_avg')
      .in('user_id', appCnaIds);
    (cnas ?? []).forEach((c) =>
      appCnaInfo.set(c.user_id, {
        name: `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`,
        rating: c.rating_avg,
      }),
    );
  }

  // ---- Roster count ---------------------------------------------------------
  const { count: rosterCount } = await supabase
    .from('approved_roster')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  // ---- Most recent invoice --------------------------------------------------
  const { data: latestInvoice } = await supabase
    .from('invoices')
    .select('invoice_number, period_start, period_end, total_cents, status, due_date')
    .eq('org_id', orgId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ---- Week fill rate -------------------------------------------------------
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const { data: weekShifts } = await supabase
    .from('business_shifts')
    .select('status')
    .eq('org_id', orgId)
    .gte('shift_date', todayStr)
    .lte('shift_date', weekEnd.toISOString().slice(0, 10));
  const weekTotal = weekShifts?.length ?? 0;
  const weekFilled = (weekShifts ?? []).filter((s) => s.status !== 'open' && s.status !== 'cancelled').length;
  const weekPct = weekTotal > 0 ? Math.round((weekFilled / weekTotal) * 100) : null;

  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12 relative">
      <div className="absolute -top-20 right-0 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-sky/10 blur-3xl pointer-events-none" />

      {/* GREETING */}
      <section className="mb-8 fade-up relative">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">{dateLabel}</div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight font-light">
              Good to see you, {firstName}.
              {openCount > 0 && (
                <>
                  <br />
                  <span className="italic font-medium text-gradient">
                    {openCount} {openCount === 1 ? 'shift still needs' : 'shifts still need'} coverage today.
                  </span>
                </>
              )}
            </h1>
          </div>
        </div>
      </section>

      {/* TOP STATS */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4 mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Today's coverage</div>
          <div className="font-display text-3xl font-medium mt-1">{shifts.length > 0 ? `${filledCount} / ${shifts.length}` : '—'}</div>
          <div className={`text-xs mt-1 ${openCount > 0 ? 'text-coral' : 'text-ink/60'}`}>
            {shifts.length > 0 ? `${openCount} open` : 'No shifts today'}
          </div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">This week</div>
          <div className="font-display text-3xl font-medium mt-1">{weekTotal > 0 ? `${weekFilled} / ${weekTotal}` : '—'}</div>
          <div className="text-xs text-ink/60 mt-1">{weekPct != null ? `${weekPct}% fill rate` : 'No shifts posted'}</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Applications</div>
          <div className="font-display text-3xl font-medium mt-1 text-deepteal">{totalAppCount ?? 0}</div>
          <div className="text-xs text-ink/60 mt-1">Awaiting your review</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Latest invoice</div>
          <div className="font-display text-3xl font-medium mt-1">
            {latestInvoice ? formatCents(latestInvoice.total_cents, { showFraction: false }) : '$0'}
          </div>
          <div className="text-xs text-ink/60 mt-1">
            {latestInvoice ? `Net-30 · ${latestInvoice.status}` : 'No invoices yet'}
          </div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Approved roster</div>
          <div className="font-display text-3xl font-medium mt-1">{rosterCount ?? 0}</div>
          <div className="text-xs text-ink/60 mt-1">Familiar caregivers</div>
        </div>
      </section>

      {/* TODAY'S COVERAGE BOARD */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Live shift board</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Today's coverage</h2>
          </div>
          <Link href="/business/schedule" className="text-sm text-deepteal hover:text-coral transition">
            Full schedule →
          </Link>
        </div>

        {shifts.length > 0 ? (
          <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
              <div className="col-span-3">Time</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-3">Caregiver</div>
              <div className="col-span-1 text-right">Bill</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {shifts.map((s) => {
              const meta = SHIFT_STATUS_META[s.status] ?? SHIFT_STATUS_META.open;
              const assigned = s.assigned_cna_id ? cnaNames.get(s.assigned_cna_id) : null;
              return (
                <div
                  key={s.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 text-sm border-b border-ink/10 hover:bg-mist/40 transition items-center ${s.status === 'open' ? 'bg-coral/5' : ''}`}
                >
                  <div className="col-span-3">
                    <div className="font-medium">{formatShiftTime(s.start_time, s.end_time)}</div>
                    {s.requires_dementia_cert && <div className="text-xs text-ink/60">Dementia cert</div>}
                  </div>
                  <div className="col-span-3 text-xs text-ink/70">
                    {s.services_required && s.services_required.length > 0
                      ? s.services_required.slice(0, 2).map((r: string) => r.replace(/_/g, ' ')).join(', ')
                      : 'CNA · General'}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    {assigned ? (
                      <>
                        <div className={`w-8 h-8 rounded-full ${avatarClass(assigned.name)} flex items-center justify-center text-cream text-xs font-medium`}>
                          {initials(assigned.name)}
                        </div>
                        <div>
                          <div className="font-medium">{assigned.name}</div>
                          {assigned.rating != null && <div className="text-xs text-ink/60">★ {Number(assigned.rating).toFixed(1)}</div>}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs italic text-ink/50">No one assigned yet</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right font-mono text-xs">{formatCents(s.bill_rate_cents, { showFraction: false })}</div>
                  <div className="col-span-2 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] border px-2.5 py-1 rounded-full font-mono ${meta.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="px-5 py-3 bg-mist/30 border-t border-ink/10 flex items-center justify-between text-xs">
              <div className="text-ink/60 font-mono">
                {shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'} today · {openCount} unfilled
              </div>
              <div className="flex gap-3">
                <Link href="/business/post-shifts" className="text-deepteal hover:text-coral font-medium">+ Post a shift</Link>
                <Link href="/business/schedule" className="text-deepteal hover:text-coral font-medium">View full schedule</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-display text-xl font-medium mb-1">No shifts scheduled for today</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto mb-5">
              Post shifts and CNAs in your area will apply. Confirmed caregivers show up here as today's
              coverage board.
            </p>
            <Link href="/business/post-shifts" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Post a shift →
            </Link>
          </div>
        )}
      </section>

      {/* APPLICATIONS + INVOICE + ROSTER */}
      <section className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* Applications to review */}
        <div className="lg:col-span-2 fade-up" style={{ animationDelay: '.15s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Awaiting review</div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">
                {totalAppCount ?? 0} {(totalAppCount ?? 0) === 1 ? 'application' : 'applications'}
              </h2>
            </div>
            <Link href="/business/post-shifts" className="text-sm text-deepteal hover:text-coral transition">All →</Link>
          </div>

          {pendingApps.length > 0 ? (
            <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
              {pendingApps.map((a, i) => {
                const info = appCnaInfo.get(a.cna_id);
                const name = info?.name ?? 'Caregiver';
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 p-4 hover:bg-mist/50 transition ${i < pendingApps.length - 1 ? 'border-b border-ink/10' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${avatarClass(name)} flex items-center justify-center text-cream font-display text-sm font-medium flex-shrink-0`}>
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <div className="font-medium text-sm truncate">{name}</div>
                        <div className="text-xs text-ink/50 font-mono whitespace-nowrap ml-2">
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-xs text-ink/60">
                        {info?.rating != null ? `★ ${Number(info.rating).toFixed(1)} · ` : ''}Applied to an open shift
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
              <p className="text-sm text-ink/60">No applications awaiting review.</p>
            </div>
          )}
        </div>

        {/* Invoice + roster */}
        <div className="space-y-6 fade-up" style={{ animationDelay: '.2s' }}>
          <div className="bg-gradient-to-br from-mist/80 to-creamdark/70 border border-ink/10 rounded-2xl p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Latest invoice · Net-30</div>
            {latestInvoice ? (
              <>
                <div className="font-display text-3xl font-medium">{formatCents(latestInvoice.total_cents)}</div>
                <div className="text-xs text-ink/60 mt-1 leading-relaxed">
                  {new Date(latestInvoice.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                  {new Date(latestInvoice.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {latestInvoice.due_date ? ` · Due ${new Date(latestInvoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                </div>
                <Link href="/business/invoices" className="block mt-4 bg-deepteal text-cream text-center py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                  View invoice details →
                </Link>
              </>
            ) : (
              <>
                <div className="font-display text-3xl font-medium">$0</div>
                <div className="text-xs text-ink/60 mt-1 leading-relaxed">
                  Your first monthly invoice appears here once caregivers complete shifts.
                </div>
                <Link href="/business/invoices" className="block mt-4 bg-deepteal text-cream text-center py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                  How billing works →
                </Link>
              </>
            )}
          </div>

          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50">Approved roster</div>
                <div className="font-display text-xl font-medium mt-0.5">
                  {rosterCount ?? 0} {(rosterCount ?? 0) === 1 ? 'caregiver' : 'caregivers'}
                </div>
              </div>
              <Link href="/business/roster" className="text-xs text-deepteal hover:text-coral">Manage →</Link>
            </div>
            <p className="text-xs text-ink/70 leading-relaxed">
              CNAs on your roster see your shifts first. Add more to fill faster.
            </p>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.25s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Quick actions</div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">What's next?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/business/post-shifts?bulk=1" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-coral/15 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📋</div>
            <div className="font-display text-lg font-medium mb-1">Post bulk shifts</div>
            <div className="text-xs text-ink/60 leading-relaxed">Post next week's open shifts in minutes using templates.</div>
          </Link>
          <Link href="/business/roster" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⭐</div>
            <div className="font-display text-lg font-medium mb-1">Grow your roster</div>
            <div className="text-xs text-ink/60 leading-relaxed">Save caregivers who've worked here so they see your shifts first.</div>
          </Link>
          <Link href="/business/timesheets" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⏱</div>
            <div className="font-display text-lg font-medium mb-1">Approve timesheets</div>
            <div className="text-xs text-ink/60 leading-relaxed">Sign off clock-in/out before payroll and invoicing trigger.</div>
          </Link>
          <Link href="/business/reports" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <div className="font-display text-lg font-medium mb-1">CFO-ready report</div>
            <div className="text-xs text-ink/60 leading-relaxed">Fill rate, hours, and cost per hour — exportable for your CFO.</div>
          </Link>
        </div>
      </section>
    </main>
  );
}
