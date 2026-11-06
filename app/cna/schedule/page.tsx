/**
 * /cna/schedule — caregiver schedule & availability. Ported 1:1 from
 * CNA-Portal/my-schedule.html.
 *
 * DATA NOTE: No bookings/shifts system is wired yet. The calendar, upcoming
 * shifts, and stats use realistic STATIC filler (marked FILLER). The recurring
 * availability editor is a real interactive component (AvailabilityEditor) but
 * its state isn't persisted to cna_availability yet.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AvailabilityEditor } from '@/components/cna/AvailabilityEditor';

export const dynamic = 'force-dynamic';

// ---- FILLER (no bookings system yet) ---------------------------------------
const WEEK_DAYS = [
  { dow: 'Mon', date: '11', shift: { name: 'Eleanor K.', time: '9 AM – 1 PM', pay: '$104', bg: 'bg-deepteal' } },
  { dow: 'Tue', date: '12', shift: { name: 'Margaret P.', time: '9 AM – 1 PM', pay: '$104', bg: 'bg-teal' } },
  { dow: 'Wed', date: '13', shift: { name: 'Eleanor K.', time: '9 AM – 1 PM', pay: '$104', bg: 'bg-deepteal' } },
  { dow: 'Thu', date: '14', shift: { name: 'Margaret P.', time: '9 AM – 1 PM', pay: '$104', bg: 'bg-teal' } },
  { dow: 'Fri', date: '15', today: true, shift: { name: 'Eleanor K.', time: '9 AM – 1 PM', pay: 'Today · $104', bg: 'bg-coral' } },
  { dow: 'Sat', date: '16', off: true },
  { dow: 'Sun', date: '17', off: true },
];

const UPCOMING = [
  { initials: 'EK', av: 'av-2', name: 'Eleanor K.', note: "Sarah's mom · Recurring · 38 shifts together", date: 'Fri, May 15', time: '9 AM – 1 PM · 4 hrs', pay: '$104', today: true },
  { initials: 'EK', av: 'av-2', name: 'Eleanor K.', note: "Sarah's mom · Recurring", date: 'Mon, May 18', time: '9 AM – 1 PM · 4 hrs', pay: '$104' },
  { initials: 'MP', av: 'av-6', name: 'Margaret P.', note: 'Recurring · 12 shifts together', date: 'Tue, May 19', time: '9 AM – 1 PM · 4 hrs', pay: '$104' },
];
// ----------------------------------------------------------------------------

export default async function CnaSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-10 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Schedule</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Your <span className="italic font-medium text-gradient">week</span> at a glance.
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            4 confirmed shifts · 16 hours · $416 expected earnings.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-ink/15 px-4 py-2.5 text-sm rounded-full hover:bg-mist transition flex items-center gap-2">
            <span>📅</span> Sync with Google Calendar
          </button>
          <button className="bg-deepteal text-cream px-5 py-2.5 text-sm rounded-full hover:bg-inkdark transition">
            ✎ Edit availability
          </button>
        </div>
      </section>

      {/* TOP STATS — FILLER */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">This week</div>
          <div className="font-display text-3xl font-medium mt-1">4 <span className="text-sm text-ink/50 font-sans">shifts</span></div>
          <div className="text-xs text-ink/60 mt-1">16 hours</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Next week</div>
          <div className="font-display text-3xl font-medium mt-1">3 <span className="text-sm text-ink/50 font-sans">shifts</span></div>
          <div className="text-xs text-ink/60 mt-1">12 hours · 1 slot open Wed</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Available hrs/wk</div>
          <div className="font-display text-3xl font-medium mt-1 text-deepteal">28</div>
          <div className="text-xs text-ink/60 mt-1">12 booked · 16 open</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Status</div>
          <div className="font-display text-2xl font-medium mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sage" /> Available
          </div>
          <div className="text-xs text-ink/60 mt-1">Accepting new jobs</div>
        </div>
      </section>

      {/* VIEW SWITCHER */}
      <section className="mb-6 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-ink/10 rounded-full p-1 inline-flex gap-1">
          <button className="px-5 py-2 text-sm rounded-full bg-deepteal text-cream">Week view</button>
          <button className="px-5 py-2 text-sm rounded-full hover:bg-mist transition">Month view</button>
          <button className="px-5 py-2 text-sm rounded-full hover:bg-mist transition">List</button>
          <button className="px-5 py-2 text-sm rounded-full hover:bg-mist transition">Set availability</button>
        </div>
      </section>

      {/* WEEK CALENDAR — FILLER */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.15s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
            <div>
              <div className="font-display text-2xl font-medium">May 11 – 17, 2026</div>
              <div className="text-xs text-ink/60 font-mono mt-0.5">Week 20</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-mist transition">‹</button>
              <button className="px-4 py-2 text-xs font-medium border border-ink/15 rounded-full hover:bg-mist transition">Today</button>
              <button className="w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-mist transition">›</button>
            </div>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 border-b border-ink/10 bg-mist/30">
            {WEEK_DAYS.map((d) => (
              <div key={d.dow} className={`px-3 py-3 text-center ${d.today ? 'bg-coral/10 border-x border-coral/30' : ''}`}>
                <div className={`text-[10px] font-mono uppercase tracking-widest ${d.today ? 'text-coral' : 'text-ink/50'}`}>
                  {d.today ? `${d.dow} · today` : d.dow}
                </div>
                <div className={`font-display text-lg font-medium mt-0.5 ${d.today ? 'text-coral' : ''}`}>{d.date}</div>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 min-h-[280px]">
            {WEEK_DAYS.map((d, i) => (
              <div key={d.dow} className={`p-3 ${i < 6 ? 'border-r border-ink/10' : ''} cal-day ${d.shift ? 'has-shift' : ''} ${d.today ? 'today' : ''}`}>
                {d.shift ? (
                  <div className={`${d.shift.bg} text-cream rounded-lg p-2 text-xs space-y-1 relative`}>
                    {d.today && <div className="absolute -top-1 -right-1 w-2 h-2 bg-cream rounded-full animate-pulse" />}
                    <div className="font-medium">{d.shift.name}</div>
                    <div className="font-mono opacity-80">{d.shift.time}</div>
                    <div className="opacity-70">{d.shift.pay}</div>
                  </div>
                ) : (
                  <div className="text-[10px] text-ink/40 italic">Weekend off</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING + AVAILABILITY */}
      <section className="grid lg:grid-cols-3 gap-6 mb-12">
        {/* UPCOMING SHIFTS — FILLER */}
        <div className="lg:col-span-2 fade-up" style={{ animationDelay: '.2s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Next up</div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">Upcoming shifts</h2>
            </div>
            <button className="text-sm text-deepteal hover:text-coral transition">See all →</button>
          </div>

          <div className="space-y-3">
            {UPCOMING.map((s, i) => (
              <div
                key={i}
                className={`card-hover bg-white border rounded-2xl p-5 relative ${s.today ? 'border-coral/30' : 'border-ink/10'}`}
              >
                {s.today && (
                  <div className="absolute top-0 right-0 bg-coral text-cream text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl-2xl rounded-tr-2xl">
                    Today
                  </div>
                )}
                <div className="flex gap-4 items-center flex-wrap">
                  <div className={`w-14 h-14 rounded-2xl ${s.av} flex items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0`}>
                    {s.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg font-medium">{s.name}</div>
                    <div className="text-xs text-ink/60 mt-0.5">{s.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">{s.date}</div>
                    <div className="text-xs text-ink/60">{s.time}</div>
                    <div className="text-sm font-display font-medium text-deepteal mt-1">{s.pay}</div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto md:ml-3 mt-2 md:mt-0">
                    {s.today ? (
                      <>
                        <button className="flex-1 md:flex-none px-4 py-2 text-xs bg-deepteal text-cream rounded-full hover:bg-inkdark transition whitespace-nowrap">
                          🕐 Clock in
                        </button>
                        <button className="flex-1 md:flex-none w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-mist transition" title="Directions">
                          🧭
                        </button>
                        <button className="flex-1 md:flex-none w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-mist transition" title="Message">
                          💬
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="flex-1 md:flex-none px-4 py-2 text-xs border border-ink/15 rounded-full hover:bg-mist transition whitespace-nowrap">
                          View details
                        </button>
                        <button className="flex-1 md:flex-none w-9 h-9 flex items-center justify-center border border-ink/15 rounded-full hover:bg-mist transition" title="Message">
                          💬
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pending application — FILLER */}
            <div className="card-hover bg-gradient-to-br from-butter/20 to-coral/10 border border-coral/20 rounded-2xl p-5">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="w-14 h-14 rounded-2xl av-5 flex items-center justify-center text-cream font-display text-xl font-medium flex-shrink-0">
                  RT
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] bg-coral/15 text-coral px-2 py-0.5 rounded-full font-medium">Pending</span>
                    <span className="text-xs text-ink/60">Application awaiting client approval</span>
                  </div>
                  <div className="font-display text-lg font-medium">Rachel T. — Evening companion care</div>
                  <div className="text-xs text-ink/60 mt-0.5">Applied 2 hrs ago</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-medium">Mon, May 18</div>
                  <div className="text-xs text-ink/60">5–9 PM · 4 hrs</div>
                  <div className="text-sm font-display font-medium text-deepteal mt-1">$112</div>
                </div>
                <div className="flex gap-2 w-full md:w-auto md:ml-3 mt-2 md:mt-0">
                  <button className="flex-1 md:flex-none px-4 py-2 text-xs border border-coral/40 text-coral rounded-full hover:bg-coral hover:text-cream transition whitespace-nowrap">
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AVAILABILITY SIDEBAR */}
        <div className="space-y-6 fade-up" style={{ animationDelay: '.25s' }}>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Recurring availability</div>
            <h2 className="font-display text-xl font-medium mb-4">When you&rsquo;re free</h2>
            <AvailabilityEditor />
          </div>

          {/* Time off */}
          <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">🏖️</div>
              <div>
                <div className="font-display text-lg font-medium">Block off time</div>
                <div className="text-xs text-ink/60 mt-0.5">Vacation, appointments, sick days</div>
              </div>
            </div>
            <button className="w-full bg-white border border-ink/15 py-2.5 rounded-full text-sm hover:bg-mist transition">
              + Add time off
            </button>
          </div>

          {/* Calendar sync */}
          <div className="bg-gradient-to-br from-sage/15 to-teal/10 border border-teal/20 rounded-2xl p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-1">Stay in sync</div>
            <div className="font-display text-lg font-medium mb-2">Connect Google Calendar</div>
            <p className="text-xs text-ink/70 leading-relaxed mb-4">
              Push every confirmed shift to your personal calendar so you never miss one.
            </p>
            <button className="w-full bg-cream border border-ink/15 py-2.5 rounded-full text-sm hover:bg-cream/70 transition flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM9 17H7v-7h2v7zm4 0h-2v-7h2v7zm4 0h-2v-7h2v7z" />
              </svg>
              Connect calendar
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
