/**
 * CNA portal layout — shared shell for every /cna/* page.
 *
 * Renders the utility bar, main nav, and footer from the mock, wired to the
 * logged-in caregiver's real data (name, rating, years experience, location).
 * Each page provides its own <main> content as {children}.
 *
 * This is a server component so it can read the session + DB. The nav links
 * (which need the active-route highlight) are a nested client component.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
import { KindredMark } from '@/components/KindredMark';
import { SiteFooter } from '@/components/SiteFooter';
import { CnaNavLinks, CnaMobileMenu } from '@/components/cna/CnaNavLinks';
import { WelcomeCelebration } from '@/components/cna/WelcomeCelebration';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { loadUnreadTotal } from '@/lib/messaging';
import { InboxRealtimeRefresh } from '@/components/messaging/InboxRealtimeRefresh';
import { PresencePinger } from '@/components/messaging/PresencePinger';
import { getViewer } from '@/lib/viewer';

export default async function CnaLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, viewingAs } = await getViewer();
  if (!user) redirect('/login');

  // Pull the caregiver's display data for the shell + the unread message
  // count for the nav badge. Run in parallel.
  const [userRes, profileRes, unreadCount] = await Promise.all([
    supabase.from('users').select('full_name, email').eq('id', user.id).single(),
    supabase
      .from('cna_profiles')
      .select('display_name, rating_avg, rating_count, years_experience, service_zip, tier, availability_status, application_status, welcome_seen_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    loadUnreadTotal(supabase, user.id),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;

  // One-time "You're in!" welcome after Kindred accepts them.
  const showWelcome =
    !viewingAs &&
    !!profile &&
    (profile.application_status === 'verifying' || profile.application_status === 'approved') &&
    !profile.welcome_seen_at;
  let listedNow = false;
  if (showWelcome) {
    const { data: access } = await supabase.rpc('my_access');
    const row = Array.isArray(access) ? access[0] : access;
    listedNow = !!(row as { is_listed?: boolean } | null)?.is_listed;
  }

  const fullName = me?.full_name ?? 'Caregiver';
  const firstName = (profile?.display_name || fullName).split(' ')[0];
  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);

  // Utility-bar facts — only show what's real. If a profile field is missing,
  // we simply omit that segment (per "real data only, leave the rest empty").
  const ratingText =
    profile?.rating_avg != null && profile?.rating_count
      ? `★ ${profile.rating_avg.toFixed(1)} (${profile.rating_count} reviews)`
      : null;
  const experienceText =
    profile?.years_experience != null
      ? `Verified caregiver · ${profile.years_experience} yrs`
      : null;
  const locationText = profile?.service_zip ? `📍 ${profile.service_zip}` : '📍 Florida';

  return (
    <div className="min-h-screen flex flex-col">
      {/* UTILITY BAR */}
      <div className="bg-inkdark text-cream text-xs">
        <div className="max-w-kindred mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono">{locationText}</span>
            {experienceText && (
              <>
                <span className="opacity-50 hidden md:inline">·</span>
                <span className="hidden md:inline opacity-80">{experienceText}</span>
              </>
            )}
            {ratingText && (
              <>
                <span className="opacity-50 hidden md:inline">·</span>
                <span className="hidden md:inline text-sage">{ratingText}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href="/cna/help" className="hover:text-sage transition">
              Help
            </Link>
            <Link href="/cna/settings" className="flex items-center gap-2 hover:text-sage transition">
              <span
                className={`w-6 h-6 rounded-full ${avClass} flex items-center justify-center text-cream font-medium text-[10px]`}
              >
                {userInitials}
              </span>
              <span className="font-medium">{firstName}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN NAV */}
      <header className="bg-cream/90 backdrop-blur-md border-b border-ink/10 sticky top-0 z-40">
        <div className="max-w-kindred mx-auto px-4 sm:px-6 py-3 xl:py-4 flex items-center justify-between gap-4 xl:gap-6">
          <Link href="/cna/dashboard" className="flex items-center gap-2.5 shrink-0">
            <KindredMark size={40} />
            <span className="font-display text-2xl font-medium tracking-tight">Kindred</span>
            <span className="hidden 2xl:inline text-xs font-mono text-ink/50 ml-1 mt-2">
              for caregivers
            </span>
          </Link>

          <CnaNavLinks unreadCount={unreadCount} />

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cna/jobs"
              className="inline-flex items-center whitespace-nowrap bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-coral transition"
            >
              Find work
            </Link>
            <form action={logoutAction} className="hidden xl:block">
              <button
                type="submit"
                className="inline-flex items-center whitespace-nowrap border border-ink/15 px-3 py-2 rounded-full text-sm hover:bg-mist transition"
              >
                Log out
              </button>
            </form>
            <CnaMobileMenu unreadCount={unreadCount} logoutAction={logoutAction} />
          </div>
        </div>
      </header>

      {showWelcome && <WelcomeCelebration firstName={firstName} listed={listedNow} />}

      {/* PAGE CONTENT */}
      <InboxRealtimeRefresh currentUserId={user.id} />
      <PresencePinger />
      <div className="flex-1">{children}</div>

      {/* FOOTER */}
      <SiteFooter contactHref="/cna/help" />
    </div>
  );
}
