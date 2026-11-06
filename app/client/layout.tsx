/**
 * Client portal layout — shared shell for every /client/* page.
 *
 * Renders the utility bar, main nav, and footer from the mock, wired to the
 * logged-in family member's real data. Each page provides its own <main>
 * content as {children}.
 *
 * Data policy (per Nick, real-data-only like the CNA portal): the utility-bar
 * status line ("Mom's care · <CNA> is on shift") only renders when there's an
 * actual active booking + an in-progress shift today. No fake "Maria on shift".
 *
 * Server component so it can read the session + DB. Active-route highlighting
 * lives in the nested <ClientNavLinks/> client component; the profile dropdown
 * is <ClientProfileMenu/>.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/(auth)/actions';
import { KindredMark } from '@/components/KindredMark';
import { SiteFooter } from '@/components/SiteFooter';
import { ClientNavLinks } from '@/components/client/ClientNavLinks';
import { ClientProfileMenu } from '@/components/client/ClientProfileMenu';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { loadUnreadTotal } from '@/lib/messaging';
import { InboxRealtimeRefresh } from '@/components/messaging/InboxRealtimeRefresh';
import { PresencePinger } from '@/components/messaging/PresencePinger';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Pull the family member's display data + their care recipient + any active
  // booking for the shell. All in parallel. Also fetch the unread message
  // count for the nav badge.
  const [userRes, profileRes, recipientsRes, unreadCount] = await Promise.all([
    supabase.from('users').select('full_name, email').eq('id', user.id).single(),
    supabase.from('client_profiles').select('name, zip, city, state').eq('user_id', user.id).maybeSingle(),
    supabase.from('care_recipients').select('id, name').eq('client_id', user.id),
    loadUnreadTotal(supabase, user.id),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const recipients = recipientsRes.data ?? [];

  const fullName = profile?.name || me?.full_name || 'there';
  const firstName = fullName.split(' ')[0];
  const email = me?.email ?? '';
  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);

  // Location segment — real ZIP if we have it, else a sensible FL default.
  const locationText = profile?.zip
    ? `📍 ${profile.city ? `${profile.city}, ` : ''}${profile.state ?? 'FL'} · ${profile.zip}`
    : '📍 Florida';

  // Active-care status line — only show if there's a booking that's currently
  // active AND a shift in progress right now. Otherwise omit (no fake filler).
  let activeStatusText: string | null = null;
  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('id, cna_id, status')
    .eq('client_id', user.id)
    .eq('status', 'active');

  if (activeBookings && activeBookings.length > 0) {
    const bookingIds = activeBookings.map((b) => b.id);
    const nowIso = new Date().toISOString();
    const { data: liveShifts } = await supabase
      .from('shifts')
      .select('booking_id, status, scheduled_start, scheduled_end')
      .in('booking_id', bookingIds)
      .eq('status', 'clocked_in')
      .lte('scheduled_start', nowIso)
      .gte('scheduled_end', nowIso)
      .limit(1);

    if (liveShifts && liveShifts.length > 0) {
      const onShift = activeBookings.find((b) => b.id === liveShifts[0].booking_id);
      if (onShift) {
        const { data: cna } = await supabase
          .from('cna_profiles')
          .select('display_name, last_name')
          .eq('user_id', onShift.cna_id)
          .maybeSingle();
        const recipientFirst = recipients[0]?.name?.split(' ')[0];
        const cnaName = cna
          ? `${cna.display_name}${cna.last_name ? ' ' + cna.last_name[0] + '.' : ''}`
          : 'Your caregiver';
        activeStatusText = recipientFirst
          ? `${recipientFirst}'s care · ${cnaName} is on shift`
          : `${cnaName} is on shift`;
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* UTILITY BAR */}
      <div className="bg-inkdark text-cream text-xs">
        <div className="max-w-kindred mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono">{locationText}</span>
            {activeStatusText && (
              <>
                <span className="opacity-50 hidden md:inline">·</span>
                <span className="hidden md:inline opacity-80">{activeStatusText}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href="/client/help" className="hover:text-sage transition">
              Help
            </Link>
            <ClientProfileMenu
              firstName={firstName}
              fullName={fullName}
              email={email}
              initials={userInitials}
              avatarClass={avClass}
              logoutAction={logoutAction}
            />
          </div>
        </div>
      </div>

      {/* MAIN NAV */}
      <header className="bg-cream/90 backdrop-blur-md border-b border-ink/10 sticky top-0 z-40">
        <div className="max-w-kindred mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/client/dashboard" className="flex items-center gap-2.5">
            <KindredMark size={40} />
            <span className="font-display text-2xl font-medium tracking-tight">Kindred</span>
          </Link>

          <ClientNavLinks unreadCount={unreadCount} />

          <div className="flex items-center gap-2">
            <Link
              href="/client/browse"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm border border-ink/15 rounded-full hover:bg-mist transition"
            >
              Find a caregiver
            </Link>
            <Link
              href="/client/post-job"
              className="inline-flex items-center bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-coral transition"
            >
              + Post a job
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <InboxRealtimeRefresh currentUserId={user.id} />
      <PresencePinger />
      <div className="flex-1">{children}</div>

      {/* FOOTER */}
      <SiteFooter contactHref="/client/help" />
    </div>
  );
}
