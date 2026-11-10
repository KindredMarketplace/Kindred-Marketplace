/**
 * /cna/schedule — caregiver schedule & availability.
 *
 * DATA NOTE: There is no bookings/shifts system, and Kindred doesn't run
 * timesheets, clock-in, or pay for shifts: caregivers and families agree on
 * schedules and pay directly. So the mock's filler calendar, upcoming shifts
 * with pay amounts, and stats are gone, replaced by an honest empty state.
 * The recurring availability editor is a real interactive component
 * (AvailabilityEditor), though its state isn't persisted to cna_availability yet.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AvailabilityEditor } from '@/components/cna/AvailabilityEditor';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function CnaSchedulePage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-10 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Schedule</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Your <span className="italic font-medium text-gradient">week</span> at a glance.
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Set when you&rsquo;re free so families can find you. Schedules are agreed directly between
          you and each family.
        </p>
      </section>

      <section className="grid lg:grid-cols-3 gap-6 mb-12">
        {/* UPCOMING — honest empty state */}
        <div className="lg:col-span-2 fade-up" style={{ animationDelay: '.05s' }}>
          <div className="mb-5">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Next up</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Upcoming work</h2>
          </div>
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-display text-xl font-medium mb-1">Nothing on your schedule yet</h3>
            <p className="text-sm text-ink/60 max-w-md mx-auto mb-5">
              When you and a family agree to work together, you set the days, hours, and rate with
              them directly. Kindred doesn&rsquo;t run timesheets or handle pay.
            </p>
            <Link
              href="/cna/jobs"
              className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition"
            >
              Find open jobs →
            </Link>
          </div>
        </div>

        {/* AVAILABILITY SIDEBAR */}
        <div className="space-y-6 fade-up" style={{ animationDelay: '.1s' }}>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Recurring availability</div>
            <h2 className="font-display text-xl font-medium mb-4">When you&rsquo;re free</h2>
            <AvailabilityEditor />
          </div>

          {/* Time off — not built yet */}
          <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🏖️</div>
              <div>
                <div className="font-display text-lg font-medium">Block off time</div>
                <div className="text-xs text-ink/60 mt-0.5">Vacation, appointments, sick days. Coming soon.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
