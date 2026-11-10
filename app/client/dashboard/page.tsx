/**
 * /client/dashboard — the family home view. Ported 1:1 from
 * Client-Portal/dashboard.html. The shell (utility bar / nav / footer) lives
 * in app/client/layout.tsx.
 *
 * Data policy (real-data-only, matching the CNA portal): show REAL data where
 * it exists; where a feature has no DB home yet for THIS user (current
 * caregiver, upcoming visits, recent messages, billing total, saved count),
 * render an explicit empty state rather than the mock's "Maria / $624" filler.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

const TIER_LABEL: Record<string, string> = {
  new: 'New',
  verified: 'Verified',
  top_rated: 'Top Rated',
};

function age(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default async function ClientDashboardPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [userRes, profileRes, recipientsRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('client_profiles').select('name, zip').eq('user_id', user.id).maybeSingle(),
    supabase.from('care_recipients').select('*').eq('client_id', user.id),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const recipients = recipientsRes.data ?? [];
  const recipient = recipients[0] ?? null;
  const firstName = (profile?.name || me?.full_name || 'there').split(' ')[0];

  // Active booking → current caregiver. Most-recent booking with the family.
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, cna_id, status, start_date, hourly_rate_cents')
    .eq('client_id', user.id)
    .in('status', ['active', 'scheduled'])
    .order('start_date', { ascending: false });

  const currentBooking = bookings?.[0] ?? null;

  let caregiver:
    | {
        display_name: string;
        last_name: string | null;
        rating_avg: number | null;
        rating_count: number;
        tier: string;
        years_experience: number | null;
        completed_shifts_count: number;
      }
    | null = null;
  if (currentBooking) {
    const { data: cards } = await supabase.rpc('caregiver_cards', { ids: [currentBooking.cna_id] });
    const c = cards?.[0];
    caregiver = c
      ? {
          display_name: c.display_name ?? 'Caregiver',
          last_name: c.last_name,
          rating_avg: c.rating_avg,
          rating_count: c.rating_count ?? 0,
          tier: c.tier,
          years_experience: c.years_experience,
          completed_shifts_count: c.completed_shifts_count ?? 0,
        }
      : null;
  }

  // Upcoming shifts (next 7) across this family's bookings.
  const bookingIds = (bookings ?? []).map((b) => b.id);
  let upcomingShifts: Array<{
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
    booking_id: string;
  }> = [];
  if (bookingIds.length > 0) {
    const { data } = await supabase
      .from('shifts')
      .select('id, scheduled_start, scheduled_end, status, booking_id')
      .in('booking_id', bookingIds)
      .gte('scheduled_end', new Date().toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(6);
    upcomingShifts = data ?? [];
  }

  // Posted jobs for this client + applicant counts per job.
  const { data: myJobs } = await supabase
    .from('jobs')
    .select('id, title, status, posted_at, hours_per_week, budget_min_cents, budget_max_cents, schedule_type')
    .eq('client_id', user.id)
    .in('status', ['open', 'in_review', 'draft'])
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(5);
  const postedJobs = myJobs ?? [];

  const applicantCounts = new Map<string, { total: number; unread: number }>();
  if (postedJobs.length > 0) {
    const jobIds = postedJobs.map((j) => j.id);
    const { data: apps } = await supabase
      .from('job_applications')
      .select('job_id, status')
      .in('job_id', jobIds);
    (apps ?? []).forEach((a) => {
      const entry = applicantCounts.get(a.job_id) ?? { total: 0, unread: 0 };
      entry.total += 1;
      if (a.status === 'submitted') entry.unread += 1;
      applicantCounts.set(a.job_id, entry);
    });
  }

  // Saved caregivers count.
  const { count: favCount } = await supabase
    .from('favorites')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', user.id);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const cgFullName = caregiver
    ? `${caregiver.display_name}${caregiver.last_name ? ' ' + caregiver.last_name[0] + '.' : ''}`
    : null;
  const cgInitials = caregiver ? initials(caregiver.display_name) : '';
  const cgAv = caregiver ? avatarClass(caregiver.display_name) : 'av-1';
  const recipientAge = recipient ? age(recipient.date_of_birth) : null;
  const recipientInitials = recipient ? initials(recipient.name) : '';
  const recipientAv = recipient ? avatarClass(recipient.name) : 'av-2';

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14 relative">
      {/* Decorative blobs */}
      <div className="absolute -top-20 right-0 w-[36rem] h-[36rem] rounded-full bg-sage/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-sky/10 blur-3xl pointer-events-none" />

      {/* GREETING */}
      <section className="mb-10 fade-up relative">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">{today}</div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight font-light">
              Good to see you, {firstName}.
              {recipient && caregiver && (
                <>
                  <br />
                  <span className="italic font-medium text-gradient">
                    {recipient.name.split(' ')[0]}'s in good hands.
                  </span>
                </>
              )}
            </h1>
          </div>
        </div>
      </section>

      {/* CURRENT CAREGIVER HERO — real booking, else empty state */}
      {caregiver && currentBooking ? (
        <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl overflow-hidden shadow-xl relative grain">
            <div className="relative p-8 lg:p-10 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex items-center gap-5">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full ${cgAv} ring-4 ring-cream/30 flex items-center justify-center text-cream font-display text-3xl font-medium`}>
                    {cgInitials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-cream text-deepteal text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md">
                    ✓
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-cream/70 font-mono mb-1">Current caregiver</div>
                  <div className="font-display text-3xl lg:text-4xl font-medium">{cgFullName}</div>
                  <div className="text-cream/85 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
                    {caregiver.rating_avg != null && caregiver.rating_count > 0 && (
                      <>
                        <span>★ {Number(caregiver.rating_avg).toFixed(1)} ({caregiver.rating_count} reviews)</span>
                        <span className="opacity-50">·</span>
                      </>
                    )}
                    <span>{TIER_LABEL[caregiver.tier] ?? caregiver.tier}</span>
                    {caregiver.years_experience != null && (
                      <>
                        <span className="opacity-50">·</span>
                        <span>{caregiver.years_experience} yrs experience</span>
                      </>
                    )}
                  </div>
                  <div className="text-cream/70 text-xs mt-1 font-mono">
                    Caring for {recipient?.name?.split(' ')[0] ?? 'your family'} since{' '}
                    {new Date(currentBooking.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 grid grid-cols-3 gap-2 lg:gap-4 text-center">
                <div>
                  <div className="font-display text-3xl lg:text-4xl font-medium">{caregiver.completed_shifts_count}</div>
                  <div className="text-xs text-cream/70 uppercase tracking-wider mt-1">Visits to date</div>
                </div>
                <div>
                  <div className="font-display text-3xl lg:text-4xl font-medium">
                    {currentBooking.hourly_rate_cents ? formatCents(currentBooking.hourly_rate_cents, { showFraction: false }) : '—'}
                  </div>
                  <div className="text-xs text-cream/70 uppercase tracking-wider mt-1">Hourly rate</div>
                </div>
                <div>
                  <div className="font-display text-3xl lg:text-4xl font-medium">
                    {caregiver.rating_avg != null ? Number(caregiver.rating_avg).toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-cream/70 uppercase tracking-wider mt-1">Rating</div>
                </div>
              </div>

              <div className="lg:col-span-3 flex lg:flex-col gap-2 lg:gap-3">
                <Link href="/client/messages" className="flex-1 bg-cream text-deepteal text-center py-3 rounded-full text-sm font-medium hover:bg-cream/90 transition">
                  💬 Message {caregiver.display_name.split(' ')[0]}
                </Link>
                <Link href="/client/browse" className="flex-1 border border-cream/40 text-cream text-center py-3 rounded-full text-sm font-medium hover:bg-cream/10 transition">
                  View profile
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-10 text-center">
            <div className="text-3xl mb-3">🤝</div>
            <h2 className="font-display text-2xl font-medium mb-1">No caregiver hired yet</h2>
            <p className="text-sm text-ink/60 max-w-md mx-auto mb-5">
              Once you hire a caregiver, you'll see them here — with their visits, your messages, and
              everything about their care, all in one place.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/client/browse" className="bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
                Find a caregiver →
              </Link>
              <Link href="/client/post-job" className="border border-ink/15 px-5 py-2.5 rounded-full text-sm hover:bg-mist transition">
                Post a job
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* UPCOMING VISITS — real shifts, else empty state */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.15s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">This week</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Upcoming visits</h2>
          </div>
          <Link href="/client/my-care" className="text-sm text-deepteal hover:text-coral transition">
            View full schedule →
          </Link>
        </div>

        {upcomingShifts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {upcomingShifts.slice(0, 3).map((s) => {
              const start = new Date(s.scheduled_start);
              const end = new Date(s.scheduled_end);
              const isLive = s.status === 'clocked_in';
              return (
                <div
                  key={s.id}
                  className={`card-hover bg-white rounded-2xl p-5 relative overflow-hidden border ${isLive ? 'border-teal/30' : 'border-ink/10'}`}
                >
                  {isLive && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-sage to-teal text-cream text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-bl-2xl">
                      On shift now
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className={`w-10 h-10 rounded-full ${cgAv} flex items-center justify-center text-cream font-display text-sm font-medium`}>
                      {cgInitials || '·'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{cgFullName ?? 'Caregiver'}</div>
                      <div className="text-xs text-ink/60">
                        {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-display text-xl font-medium mb-1">No scheduled visits yet</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto">
              Once you hire a caregiver and schedule visits, they'll appear here for the week ahead.
            </p>
          </div>
        )}
      </section>

      {/* POSTED JOBS — client's own job posts + applicant counts */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.17s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Your job posts</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">
              {postedJobs.length > 0 ? `${postedJobs.length} open ${postedJobs.length === 1 ? 'job' : 'jobs'}` : 'Posted jobs'}
            </h2>
          </div>
          <Link href="/client/post-job" className="text-sm text-deepteal hover:text-coral transition">
            + Post a job
          </Link>
        </div>

        {postedJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {postedJobs.map((j) => {
              const counts = applicantCounts.get(j.id) ?? { total: 0, unread: 0 };
              const rate =
                j.budget_min_cents != null && j.budget_max_cents != null && j.budget_min_cents !== j.budget_max_cents
                  ? `${formatCents(j.budget_min_cents, { showFraction: false })}–${formatCents(j.budget_max_cents, { showFraction: false })}`
                  : j.budget_min_cents != null
                  ? formatCents(j.budget_min_cents, { showFraction: false })
                  : j.budget_max_cents != null
                  ? formatCents(j.budget_max_cents, { showFraction: false })
                  : 'Open rate';
              const isDraft = j.status === 'draft';
              return (
                <Link
                  href={`/client/jobs/${j.id}`}
                  key={j.id}
                  className="card-hover bg-white border border-ink/10 rounded-2xl p-5 block group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-lg font-medium leading-tight truncate">{j.title}</div>
                      <div className="text-xs text-ink/60 mt-1 font-mono">
                        {rate}/hr
                        {j.hours_per_week ? ` · ${j.hours_per_week} hrs/week` : ''}
                        {' · '}
                        {j.posted_at
                          ? new Date(j.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Draft'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border whitespace-nowrap ${
                        isDraft
                          ? 'bg-mist text-ink/60 border-ink/15'
                          : 'bg-sage/15 text-deepteal border-sage/30'
                      }`}
                    >
                      {isDraft ? 'Draft' : 'Open'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-ink/10">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-medium">{counts.total}</span>
                      <span className="text-xs text-ink/60">
                        {counts.total === 1 ? 'applicant' : 'applicants'}
                      </span>
                    </div>
                    {counts.unread > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-coral/15 text-coral border border-coral/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-coral" />
                        {counts.unread} new to review
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-display text-xl font-medium mb-1">No active job posts</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto mb-5">
              Post a job describing the care you need, and qualified CNAs nearby will apply. You
              pick who feels right.
            </p>
            <Link href="/client/post-job" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Post your first job →
            </Link>
          </div>
        )}
      </section>

      {/* MAIN GRID — Messages / Billing */}
      <section className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* RECENT MESSAGES — no messaging wired yet → empty state */}
        <div className="lg:col-span-2 fade-up" style={{ animationDelay: '.2s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Inbox</div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">Recent messages</h2>
            </div>
            <Link href="/client/messages" className="text-sm text-deepteal hover:text-coral transition">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <p className="text-sm text-ink/60">No messages yet.</p>
          </div>
        </div>

        {/* BILLING SUMMARY — no payments wired yet → empty state */}
        <div className="fade-up" style={{ animationDelay: '.25s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">This month</div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">Billing</h2>
            </div>
            <Link href="/client/membership" className="text-sm text-deepteal hover:text-coral transition">
              Details →
            </Link>
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Spend so far</div>
            <div className="font-display text-5xl font-light mt-2 mb-1">
              $<span className="font-medium">0</span>
            </div>
            <div className="text-xs text-ink/60">No visits billed yet</div>
            <div className="border-t border-ink/10 my-5" />
            <div className="bg-mist/50 rounded-xl p-3 text-xs text-ink/70 leading-relaxed">
              You'll only ever be charged for hours actually worked. Receipts show up here after each
              visit.
            </div>
            <Link href="/client/membership" className="block mt-4 text-center bg-ink text-cream py-3 rounded-full text-sm hover:bg-coral transition">
              View billing
            </Link>
          </div>
        </div>
      </section>

      {/* CARE RECIPIENT AT A GLANCE — real data, else nudge to set up */}
      {recipient ? (
        <section className="mb-10 fade-up" style={{ animationDelay: '.3s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">
                {recipient.name.split(' ')[0]}'s profile
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">At a glance</h2>
            </div>
            <Link href="/client/my-care" className="text-sm text-deepteal hover:text-coral transition">
              Edit care plan →
            </Link>
          </div>

          <div className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8 grid md:grid-cols-12 gap-8">
            <div className="md:col-span-3 flex md:flex-col md:items-center gap-4 md:gap-3 md:text-center pb-6 md:pb-0 md:pr-6 md:border-r border-ink/10 border-b md:border-b-0">
              <div className={`w-20 h-20 rounded-full ${recipientAv} flex items-center justify-center text-cream font-display text-3xl font-medium`}>
                {recipientInitials}
              </div>
              <div>
                <div className="font-display text-xl font-medium">{recipient.name}</div>
                {recipientAge != null && <div className="text-xs text-ink/60 mt-1">{recipientAge} years old</div>}
                {profile?.zip && <div className="text-xs font-mono text-ink/50 mt-2">Lives at home in {profile.zip}</div>}
              </div>
            </div>

            <div className="md:col-span-9 grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-3">Conditions</div>
                {recipient.conditions && recipient.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recipient.conditions.map((c: string) => (
                      <span key={c} className="text-xs bg-mist/70 px-3 py-1.5 rounded-full border border-teal/20">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink/50">None listed yet.</p>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-3">Allergies</div>
                {recipient.allergies && recipient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recipient.allergies.map((a: string) => (
                      <span key={a} className="text-xs bg-coral/15 text-coral px-3 py-1.5 rounded-full border border-coral/30">
                        ⚠ {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink/50">None listed yet.</p>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-3">Daily meds</div>
                {recipient.medications && recipient.medications.length > 0 ? (
                  <div className="text-sm text-ink/80 leading-relaxed">{recipient.medications.join(' · ')}</div>
                ) : (
                  <p className="text-sm text-ink/50">None listed yet.</p>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-ink/50 font-mono mb-3">Likes &amp; routines</div>
                {recipient.preferences ? (
                  <div className="text-sm text-ink/80 leading-relaxed">{recipient.preferences}</div>
                ) : (
                  <p className="text-sm text-ink/50">Nothing added yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 fade-up" style={{ animationDelay: '.3s' }}>
          <div className="rounded-2xl border-2 border-sage bg-sage/10 p-6">
            <h2 className="font-display text-xl text-ink mb-2">Set up your care plan</h2>
            <p className="text-ink/70 mb-4 text-sm max-w-2xl">
              Tell us about the person you're caring for — conditions, medications, allergies, and
              routines. It's what caregivers see once you've hired them.
            </p>
            <Link href="/client/my-care" className="inline-block rounded-full bg-deepteal px-5 py-2.5 text-sm font-medium text-cream hover:bg-inkdark transition">
              Add a care recipient
            </Link>
          </div>
        </section>
      )}

      {/* QUICK ACTIONS — navigation, all real */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.35s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Things you might want to do</div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">Quick actions</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/client/browse" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
            <div className="font-display text-lg font-medium mb-1">Find a caregiver</div>
            <div className="text-xs text-ink/60 leading-relaxed">Browse vetted CNAs by skills, schedule, and distance.</div>
          </Link>

          <Link href="/client/post-job" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📝</div>
            <div className="font-display text-lg font-medium mb-1">Post a job</div>
            <div className="text-xs text-ink/60 leading-relaxed">One-off or recurring shifts. CNAs apply, you pick.</div>
          </Link>

          <Link href="/client/my-care" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📋</div>
            <div className="font-display text-lg font-medium mb-1">Update care plan</div>
            <div className="text-xs text-ink/60 leading-relaxed">Add notes, allergies, medications, or routines.</div>
          </Link>

          <Link href="/client/browse" className="card-hover bg-white border border-ink/10 rounded-2xl p-6 group">
            <div className="w-12 h-12 rounded-2xl bg-kindred-gradient-soft flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⭐</div>
            <div className="font-display text-lg font-medium mb-1">Saved caregivers</div>
            <div className="text-xs text-ink/60 leading-relaxed">
              {favCount && favCount > 0 ? `${favCount} saved.` : 'Caregivers you favorite show up here.'}
            </div>
          </Link>
        </div>
      </section>

      {/* HELP NUDGE */}
      <section className="fade-up" style={{ animationDelay: '.4s' }}>
        <div className="bg-creamdark/70 border border-ink/10 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💛</div>
            <div>
              <div className="font-display text-xl font-medium mb-1">Need to make a change?</div>
              <div className="text-sm text-ink/70 leading-relaxed max-w-xl">
                Whether you want to add a second caregiver, adjust visit times, or have questions about
                billing — we're here. Real humans, not bots.
              </div>
            </div>
          </div>
          <Link href="/client/help" className="inline-flex items-center bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition whitespace-nowrap">
            Get help →
          </Link>
        </div>
      </section>
    </main>
  );
}
