/**
 * /cna/settings — account settings.
 *
 * What works today: profile photo (tap to change), name and phone (saved),
 * email shown read-only, sign out. Everything else on this page is clearly
 * marked "Coming soon" and disabled, so nothing pretends to save:
 * notifications arrive with the notifications system (Phase 4), and the
 * security / privacy / preferences / close-account controls after that.
 *
 * On phones the section links are a horizontal, scrollable row of chips; on
 * desktop they're a sticky sidebar.
 *
 * There is no payout section: Kindred doesn't pay caregivers. Families pay
 * caregivers directly, and Kindred only bills its own membership.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getViewer } from '@/lib/viewer';
import { AvatarUpload } from '@/components/cna/AvatarUpload';
import { AccountForm } from '@/components/cna/AccountForm';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { href: '#account', icon: '👤', label: 'Account' },
  { href: '#notifications', icon: '🔔', label: 'Notifications' },
  { href: '#security', icon: '🔒', label: 'Security' },
  { href: '#privacy', icon: '🛡️', label: 'Privacy' },
  { href: '#prefs', icon: '⚙️', label: 'Preferences' },
  { href: '#danger', icon: '🗑️', label: 'Close account', danger: true },
];

const NOTIF_ROWS = [
  { title: 'New jobs near you', sub: 'Jobs that match your services and area' },
  { title: 'Messages from families', sub: 'New messages and replies' },
  { title: 'Your application', sub: 'Interview invites, acceptance, and Kindred Standard updates' },
  { title: 'Documents', sub: 'When something is verified, needs a new copy, or is about to expire' },
  { title: 'Membership', sub: 'Renewals and billing' },
];

function ComingSoon() {
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest bg-butter/60 text-deepteal px-2 py-0.5 rounded-full">
      Coming soon
    </span>
  );
}

function SectionHead({ title, sub, soon }: { title: string; sub: string; soon?: boolean }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-display text-xl font-medium">{title}</h3>
        {soon && <ComingSoon />}
      </div>
      <p className="text-sm text-ink/60 mt-1">{sub}</p>
    </div>
  );
}

export default async function CnaSettingsPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name, email, phone').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('display_name, last_name, photo_url').eq('user_id', user.id).maybeSingle(),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const fullName = me?.full_name ?? 'Caregiver';
  const first = profile?.display_name ?? fullName.split(' ')[0];
  const last = profile?.last_name ?? fullName.split(' ').slice(1).join(' ');
  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);

  const card = 'bg-white border border-ink/10 rounded-2xl p-5 sm:p-6 scroll-mt-28';

  return (
    <main className="max-w-kindred mx-auto px-4 sm:px-6 py-10 lg:py-14">
      <section className="mb-6 lg:mb-10 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Account</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Your <span className="italic font-medium text-gradient">settings.</span>
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">Your photo, your details, and how Kindred reaches you.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION LINKS: chips on phones, sidebar on desktop */}
        <aside className="min-w-0 lg:col-span-3 lg:sticky lg:top-24 lg:self-start fade-up" style={{ animationDelay: '.05s' }}>
          <nav
            aria-label="Settings sections"
            className="-mx-4 px-4 lg:mx-0 lg:px-3 lg:py-3 flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible lg:bg-white lg:border lg:border-ink/10 lg:rounded-2xl pb-1 lg:pb-3 [scrollbar-width:none]"
          >
            {SECTIONS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`shrink-0 whitespace-nowrap rounded-full lg:rounded-xl border lg:border-0 border-ink/15 bg-white lg:bg-transparent px-4 py-2 lg:px-3 lg:py-2.5 text-sm hover:bg-mist transition ${
                  l.danger ? 'text-coral' : 'text-ink'
                }`}
              >
                <span aria-hidden="true">{l.icon}</span> {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:block mt-4 bg-creamdark/70 border border-ink/10 rounded-2xl p-4 text-xs text-ink/70 leading-relaxed">
            <div className="font-medium text-ink mb-1">Profile vs. settings</div>
            Editing what families see? Head to{' '}
            <Link href="/cna/profile" className="text-deepteal hover:text-coral">My profile</Link> instead.
          </div>
        </aside>

        {/* CONTENT */}
        <section className="min-w-0 lg:col-span-9 space-y-6 fade-up" style={{ animationDelay: '.1s' }}>
          {/* ACCOUNT (works) */}
          <div id="account" className={card}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-8 pb-6 border-b border-ink/10">
              <AvatarUpload userId={user.id} photoUrl={profile?.photo_url ?? null} initials={userInitials} avatarClass={avClass} />
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl font-medium break-words">{fullName}</div>
                <div className="text-xs text-ink/60 font-mono mt-1 break-all">{me?.email ?? ''}</div>
                <div className="flex gap-2 mt-3">
                  <Link href="/cna/profile" className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">
                    Edit public profile
                  </Link>
                </div>
              </div>
            </div>
            <h3 className="font-display text-xl font-medium mb-4">Personal info</h3>
            <AccountForm first={first} last={last} email={me?.email ?? ''} phone={me?.phone ?? ''} />
          </div>

          {/* NOTIFICATIONS (coming soon) */}
          <div id="notifications" className={card}>
            <SectionHead
              title="Notifications"
              sub="Kindred doesn't send notifications yet. When it does, you'll choose here how you hear about each of these."
              soon
            />
            <fieldset disabled className="opacity-60">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-ink/50">
                <div className="col-span-6">Notification</div>
                <div className="col-span-2 text-center">In-app</div>
                <div className="col-span-2 text-center">Email</div>
                <div className="col-span-2 text-center">Text</div>
              </div>
              {NOTIF_ROWS.map((row) => (
                <div key={row.title} className="sm:grid sm:grid-cols-12 gap-4 px-3 py-3 sm:items-center text-sm border-t border-ink/10">
                  <div className="sm:col-span-6 mb-2 sm:mb-0">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                  {['In-app', 'Email', 'Text'].map((ch) => (
                    <label key={ch} className="sm:col-span-2 inline-flex sm:flex items-center sm:justify-center gap-2 mr-4 sm:mr-0 text-xs text-ink/60">
                      <span className="switch">
                        <input type="checkbox" />
                        <span className="slider" />
                      </span>
                      <span className="sm:hidden">{ch}</span>
                    </label>
                  ))}
                </div>
              ))}
            </fieldset>
          </div>

          {/* SECURITY (coming soon) */}
          <div id="security" className={card}>
            <SectionHead title="Security & sign-in" sub="Lock down your account." soon />
            <div className="space-y-4">
              {[
                { title: 'Change password', sub: 'For now, message us through Help and we’ll reset it for you.' },
                { title: 'Two-step sign-in', sub: 'A code by text or an authenticator app' },
                { title: 'Where you’re signed in', sub: 'See and sign out other devices' },
              ].map((row, i, arr) => (
                <div key={row.title} className={`flex items-center justify-between gap-3 ${i < arr.length - 1 ? 'border-b border-ink/10 pb-4' : ''}`}>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{row.title}</div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                  <button disabled className="shrink-0 text-sm px-4 py-2 border border-ink/15 rounded-full opacity-50">Soon</button>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVACY (coming soon) */}
          <div id="privacy" className={card}>
            <SectionHead
              title="Privacy"
              sub="Families who aren't members already see only your first initial, never your photo, email or phone number."
              soon
            />
            <fieldset disabled className="space-y-3 opacity-60">
              {[
                { title: 'Pause my profile in Browse', sub: 'Hide from new families for a while; families you already talk with can still message you' },
                { title: 'Download my data', sub: 'A copy of everything Kindred holds about you' },
              ].map((row) => (
                <div key={row.title} className="flex items-start gap-3 p-3 rounded-xl">
                  <input type="checkbox" className="mt-0.5 rounded" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{row.title}</div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                </div>
              ))}
            </fieldset>
          </div>

          {/* PREFERENCES (coming soon) */}
          <div id="prefs" className={card}>
            <SectionHead title="Preferences" sub="Time zone and language. Kindred uses Eastern time and English for now." soon />
          </div>

          {/* CLOSE ACCOUNT */}
          <div id="danger" className="bg-coral/5 border border-coral/30 rounded-2xl p-5 sm:p-6 scroll-mt-28">
            <h3 className="font-display text-xl font-medium mb-1 text-coral">Close account</h3>
            <p className="text-sm text-ink/70 leading-relaxed mb-4 max-w-2xl">
              Stepping away from caregiving, or taking a break? Message us through Help and a real person
              will pause or close your account for you. We keep membership billing records for as long as the
              law requires.
            </p>
            <Link href="/cna/help" className="inline-block text-sm px-4 py-2 border border-coral/40 text-coral rounded-full hover:bg-coral hover:text-cream transition">
              Message Kindred
            </Link>
          </div>

          {/* SIGN OUT */}
          <div className="flex justify-center pt-4">
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-ink/60 hover:text-coral transition">Sign out</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
