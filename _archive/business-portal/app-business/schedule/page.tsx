/**
 * /business/schedule — weekly shift grid. Ported from
 * Business-Portal/schedule.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only: the week grid is built from this org's real business_shifts
 * for the current Mon–Sun week, grouped into rows by start/end time and colored
 * by status. The summary footer is computed from those rows. View tabs, filter
 * selects, and the calendar-sync prompt render for visual parity. Empty state
 * when no shifts are posted for the week.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext, formatShiftTime } from '@/lib/business';
import { formatCents } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type Shift = {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  bill_rate_cents: number;
  status: string;
  assigned_cna_id: string | null;
};

function shiftBlockClass(status: string): string {
  switch (status) {
    case 'assigned':
    case 'in_progress':
    case 'completed':
      return 'bg-sage/[0.18] border-l-[3px] border-sage';
    case 'no_show':
    case 'cancelled':
      return 'bg-butter/40 border-l-[3px] border-butter';
    default:
      return 'bg-coral/[0.18] border-l-[3px] border-coral'; // open
  }
}

export default async function BusinessSchedulePage() {
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
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Schedule</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">Your weekly schedule.</h1>
        </section>
        <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
          <p className="text-sm text-ink/70">Set up your facility and post shifts to see your schedule here.</p>
        </div>
      </main>
    );
  }

  // Current Mon–Sun week.
  const now = new Date();
  const dow = now.getDay(); // 0 Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const weekStartStr = days[0].toISOString().slice(0, 10);
  const weekEndStr = days[6].toISOString().slice(0, 10);

  const { data: shiftData } = await supabase
    .from('business_shifts')
    .select('id, shift_date, start_time, end_time, bill_rate_cents, status, assigned_cna_id')
    .eq('org_id', ctx.orgId)
    .gte('shift_date', weekStartStr)
    .lte('shift_date', weekEndStr)
    .order('start_time', { ascending: true });

  const shifts = (shiftData ?? []) as Shift[];

  // Names for assigned CNAs.
  const ids = Array.from(new Set(shifts.map((s) => s.assigned_cna_id).filter(Boolean))) as string[];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: cnas } = await supabase.from('cna_profiles').select('user_id, display_name, last_name').in('user_id', ids);
    (cnas ?? []).forEach((c) => names.set(c.user_id, `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`));
  }

  // Group into rows by time band (start–end), then by date within each row.
  const rowKey = (s: Shift) => `${s.start_time}|${s.end_time}`;
  const rows = new Map<string, { start: string; end: string; byDate: Map<string, Shift[]> }>();
  for (const s of shifts) {
    const key = rowKey(s);
    if (!rows.has(key)) rows.set(key, { start: s.start_time, end: s.end_time, byDate: new Map() });
    const row = rows.get(key)!;
    const arr = row.byDate.get(s.shift_date) ?? [];
    arr.push(s);
    row.byDate.set(s.shift_date, arr);
  }
  const rowList = Array.from(rows.values()).sort((a, b) => a.start.localeCompare(b.start));

  // Summary.
  const filled = shifts.filter((s) => ['assigned', 'in_progress', 'completed'].includes(s.status)).length;
  const open = shifts.filter((s) => s.status === 'open').length;
  const fillPct = shifts.length > 0 ? Math.round((filled / shifts.length) * 100) : null;

  const weekLabel = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const todayStr = now.toISOString().slice(0, 10);

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12">
      {/* HEADER */}
      <section className="mb-8 fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Schedule</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Week of <span className="italic font-medium text-gradient">{weekLabel}.</span>
          </h1>
          <p className="text-ink/70 mt-2">Every shift across the week, colored by status. Open slots are ready to fill.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-white border border-ink/10 rounded-full p-1 gap-1">
            <button className="px-4 py-2 text-xs rounded-full text-ink/50" disabled>Day</button>
            <button className="px-4 py-2 text-xs rounded-full font-medium bg-gradient-to-br from-sage to-teal text-cream">Week</button>
            <button className="px-4 py-2 text-xs rounded-full text-ink/50" disabled>Month</button>
          </div>
        </div>
      </section>

      {/* LEGEND */}
      <section className="mb-6 flex items-center gap-3 text-xs flex-wrap fade-up" style={{ animationDelay: '.05s' }}>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-sage/40 border-l-2 border-sage rounded-sm" /><span className="text-ink/60">Filled</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-butter/50 border-l-2 border-butter rounded-sm" /><span className="text-ink/60">Cancelled / no-show</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-coral/20 border-l-2 border-coral rounded-sm" /><span className="text-ink/60">Open</span></div>
      </section>

      {/* WEEK GRID */}
      {shifts.length > 0 ? (
        <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="bg-white border border-ink/10 rounded-2xl overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header row */}
              <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-ink/10 bg-mist/30">
                <div className="p-3 text-xs font-mono uppercase tracking-widest text-ink/50">Shift</div>
                {days.map((d) => {
                  const ds = d.toISOString().slice(0, 10);
                  const isToday = ds === todayStr;
                  return (
                    <div key={ds} className={`p-3 text-center border-l border-ink/10 ${isToday ? 'bg-coral/10' : ''}`}>
                      <div className={`text-[10px] font-mono ${isToday ? 'text-coral' : 'text-ink/50'}`}>
                        {DAY_LABELS[d.getDay()]}
                        {isToday ? ' · TODAY' : ''}
                      </div>
                      <div className={`font-display text-base ${isToday ? 'text-coral' : ''}`}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* Time-band rows */}
              {rowList.map((row) => (
                <div key={`${row.start}-${row.end}`} className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-ink/10 last:border-b-0">
                  <div className="p-3 text-xs">
                    <div className="font-medium">{formatShiftTime(row.start, row.end)}</div>
                  </div>
                  {days.map((d) => {
                    const ds = d.toISOString().slice(0, 10);
                    const cell = row.byDate.get(ds) ?? [];
                    const isToday = ds === todayStr;
                    return (
                      <div key={ds} className={`p-2 border-l border-ink/10 space-y-1 ${isToday ? 'bg-coral/5' : ''}`}>
                        {cell.map((s) => {
                          const assigned = s.assigned_cna_id ? names.get(s.assigned_cna_id) : null;
                          return (
                            <div key={s.id} className={`rounded-md px-2 py-1.5 text-[11px] leading-tight ${shiftBlockClass(s.status)}`}>
                              <div className="font-medium truncate">{assigned ?? (s.status === 'open' ? 'Open' : 'Unassigned')}</div>
                              <div className="text-[10px] text-ink/60">
                                {s.status === 'open' ? `${formatCents(s.bill_rate_cents, { showFraction: false })}/hr` : s.status.replace(/_/g, ' ')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Summary footer */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-ink/10 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Filled this week</div>
              <div className="font-display text-2xl font-medium mt-1">{filled} / {shifts.length}</div>
              <div className="text-xs text-deepteal mt-1">{fillPct != null ? `${fillPct}% fill rate` : '—'}</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Open shifts</div>
              <div className="font-display text-2xl font-medium mt-1 text-coral">{open}</div>
              <div className="text-xs text-ink/60 mt-1">Ready to fill</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Total shifts</div>
              <div className="font-display text-2xl font-medium mt-1">{shifts.length}</div>
              <div className="text-xs text-ink/60 mt-1">This week</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-2xl p-4">
              <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Shift rows</div>
              <div className="font-display text-2xl font-medium mt-1">{rowList.length}</div>
              <div className="text-xs text-ink/60 mt-1">Distinct time bands</div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">🗓️</div>
            <h3 className="font-display text-xl font-medium mb-1">No shifts this week</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto mb-5">
              Post shifts and they'll lay out across the week here — filled, pending, and open — so you
              can see your coverage at a glance.
            </p>
            <Link href="/business/post-shifts" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Post shifts →
            </Link>
          </div>
        </section>
      )}

      {/* CALENDAR SYNC (visual parity) */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.2s' }}>
        <div className="bg-gradient-to-br from-mist/60 to-creamdark/60 border border-ink/10 rounded-3xl p-6 lg:p-8">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">📅 Calendar sync</div>
              <h3 className="font-display text-2xl font-medium mb-2">Push confirmed shifts to your facility calendar.</h3>
              <p className="text-sm text-ink/70 leading-relaxed">
                Sync confirmed Kindred shifts to Google Calendar or Outlook so your charge nurses see
                them alongside your in-house schedule. Coming soon.
              </p>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="bg-white border border-ink/10 rounded-2xl p-4 flex flex-col items-center gap-2 opacity-70">
                <span className="text-2xl">🗓</span>
                <div className="text-sm font-medium">Google Calendar</div>
                <div className="text-[10px] font-mono text-ink/40">Coming soon</div>
              </div>
              <div className="bg-white border border-ink/10 rounded-2xl p-4 flex flex-col items-center gap-2 opacity-70">
                <span className="text-2xl">📨</span>
                <div className="text-sm font-medium">Outlook</div>
                <div className="text-[10px] font-mono text-ink/40">Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
