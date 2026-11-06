/**
 * /business/timesheets — approval queue. Ported from
 * Business-Portal/timesheets.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only: rows come from the real timesheets table for this org's
 * shifts, joined to business_shifts (scheduled times) + cna_profiles (names).
 * Stat strip is computed from real timesheets. Tabs, filters, bulk controls,
 * and the auto-approve callout render for visual parity. Empty state when the
 * pending queue is clear.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext, formatShiftTime } from '@/lib/business';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

function fmtClock(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default async function BusinessTimesheetsPage() {
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
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Timesheets</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">Timesheet approvals.</h1>
        </section>
        <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
          <p className="text-sm text-ink/70">Set up your facility to start tracking timesheets.</p>
        </div>
      </main>
    );
  }

  // This org's shifts → timesheets against them.
  const { data: orgShifts } = await supabase
    .from('business_shifts')
    .select('id, shift_date, start_time, end_time, bill_rate_cents')
    .eq('org_id', ctx.orgId);
  const shiftMap = new Map((orgShifts ?? []).map((s) => [s.id, s]));
  const shiftIds = (orgShifts ?? []).map((s) => s.id);

  type TS = {
    id: string;
    shift_id: string;
    cna_id: string;
    clock_in: string | null;
    clock_out: string | null;
    hours_worked: number | null;
    status: string;
  };
  let timesheets: TS[] = [];
  if (shiftIds.length > 0) {
    const { data } = await supabase
      .from('timesheets')
      .select('id, shift_id, cna_id, clock_in, clock_out, hours_worked, status')
      .in('shift_id', shiftIds)
      .order('clock_in', { ascending: false, nullsFirst: false });
    timesheets = (data ?? []) as TS[];
  }

  const pending = timesheets.filter((t) => t.status === 'pending');
  const approvedThisMonth = timesheets.filter((t) => {
    if (t.status !== 'approved' || !t.clock_in) return false;
    const d = new Date(t.clock_in);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const approvedHours = approvedThisMonth.reduce((s, t) => s + (t.hours_worked ?? 0), 0);
  const pendingHours = pending.reduce((s, t) => s + (t.hours_worked ?? 0), 0);

  // Names for CNAs in the pending queue.
  const cnaIds = Array.from(new Set(pending.map((t) => t.cna_id)));
  const names = new Map<string, string>();
  if (cnaIds.length > 0) {
    const { data: cnas } = await supabase.from('cna_profiles').select('user_id, display_name, last_name').in('user_id', cnaIds);
    (cnas ?? []).forEach((c) => names.set(c.user_id, `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`));
  }

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12">
      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Timesheets · approval queue</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          {pending.length > 0 ? (
            <>
              <span className="italic font-medium text-gradient">
                {pending.length} {pending.length === 1 ? 'timesheet' : 'timesheets'}
              </span>{' '}
              waiting on you.
            </>
          ) : (
            <>You're all <span className="italic font-medium text-gradient">caught up.</span></>
          )}
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Once approved, hours flow into your monthly invoice and the caregiver gets paid within 24
          hours.
        </p>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Pending review</div>
          <div className="font-display text-3xl font-medium mt-1">{pending.length}</div>
          <div className="text-xs text-ink/60 mt-1">{pendingHours.toFixed(1)} hrs</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Approved this month</div>
          <div className="font-display text-3xl font-medium mt-1">{approvedThisMonth.length}</div>
          <div className="text-xs text-deepteal mt-1">{approvedHours.toFixed(0)} hrs</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Total timesheets</div>
          <div className="font-display text-3xl font-medium mt-1">{timesheets.length}</div>
          <div className="text-xs text-ink/60 mt-1">All time</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Auto-approve rule</div>
          <div className="font-display text-xl font-medium mt-1 text-deepteal">±5 min</div>
          <div className="text-xs text-ink/60 mt-1">Within GPS geofence</div>
        </div>
      </section>

      {/* TABS (visual parity) */}
      <section className="mb-6 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="flex items-center gap-6 border-b border-ink/10 flex-wrap">
          <button className="py-3 text-sm tab-active border-b-2">
            Needs review <span className="text-coral ml-1 font-mono">{pending.length}</span>
          </button>
          <button className="py-3 text-sm text-ink/50 border-b-2 border-transparent" disabled>
            Approved <span className="ml-1 font-mono">{timesheets.filter((t) => t.status === 'approved').length}</span>
          </button>
          <button className="py-3 text-sm text-ink/50 border-b-2 border-transparent" disabled>
            Disputed <span className="ml-1 font-mono">{timesheets.filter((t) => t.status === 'disputed').length}</span>
          </button>
        </div>
      </section>

      {/* TABLE */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.15s' }}>
        {pending.length > 0 ? (
          <div className="bg-white border border-ink/10 rounded-2xl overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
                <div>Caregiver</div>
                <div>Scheduled</div>
                <div>Clock in</div>
                <div>Clock out</div>
                <div>Hours</div>
                <div className="text-right">Action</div>
              </div>

              {pending.map((t) => {
                const shift = shiftMap.get(t.shift_id);
                const name = names.get(t.cna_id) ?? 'Caregiver';
                const av = avatarClass(name);
                return (
                  <div key={t.id} className="ts-row grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 text-sm items-center border-b border-ink/10 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${av} flex items-center justify-center text-cream text-xs font-medium`}>
                        {initials(name)}
                      </div>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-ink/60 font-mono">
                          {shift ? new Date(shift.shift_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono">
                      {shift ? formatShiftTime(shift.start_time, shift.end_time) : '—'}
                    </div>
                    <div className="text-xs font-mono">{fmtClock(t.clock_in)}</div>
                    <div className="text-xs font-mono">{fmtClock(t.clock_out)}</div>
                    <div className="font-mono text-sm">{t.hours_worked != null ? `${Number(t.hours_worked).toFixed(2)} hrs` : '—'}</div>
                    <div className="flex gap-1 justify-end">
                      <button className="text-xs px-3 py-1.5 bg-deepteal text-cream rounded-full hover:bg-inkdark">Approve</button>
                      <button className="text-xs px-2 py-1.5 border border-ink/15 rounded-full hover:bg-mist">Dispute</button>
                    </div>
                  </div>
                );
              })}

              <div className="px-5 py-3 bg-mist/30 border-t border-ink/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="text-ink/60 font-mono">
                  {pending.length} pending · {pendingHours.toFixed(2)} hrs
                </div>
                <button className="text-deepteal hover:text-coral font-medium">Approve all →</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-display text-xl font-medium mb-1">Nothing to review</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto">
              When caregivers clock in and out of their shifts, timesheets land here for your sign-off.
              Clean ones can auto-approve.
            </p>
          </div>
        )}
      </section>

      {/* AUTO-APPROVE CALLOUT (visual parity) */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
        <div className="bg-gradient-to-br from-mist/60 to-creamdark/60 border border-ink/10 rounded-3xl p-6 lg:p-8">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">⚙ Auto-approve</div>
              <h3 className="font-display text-2xl font-medium mb-2">Stop manually approving every shift.</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                When enabled, timesheets where clock-in/out fall within a tolerance window of the
                scheduled time (and inside the GPS geofence) approve automatically. Only flagged shifts
                reach this queue.
              </p>
            </div>
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white border border-ink/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Tolerance window</div>
                  <div className="text-xs text-ink/60">How far from scheduled is OK</div>
                </div>
                <span className="text-xs font-mono text-deepteal">±5 min</span>
              </div>
              <div className="bg-white border border-ink/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Require GPS geofence</div>
                  <div className="text-xs text-ink/60">Within 200ft of facility</div>
                </div>
                <span className="text-xs font-mono text-deepteal">On</span>
              </div>
              <Link href="/business/settings" className="block text-xs text-deepteal hover:text-coral text-right">
                Configure full rules →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
