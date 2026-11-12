/**
 * /client/account — the family's account settings (mirror of the caregiver
 * settings page).
 *
 * What works today: account photo (tap to change), name and phone (saved),
 * sign-in email shown read-only, membership link, close account (live, with
 * a confirm step), sign out. Everything else is clearly marked "Coming soon"
 * and disabled, so nothing pretends to save: notifications arrive with the
 * notifications system (Phase 4); two-step sign-in, family
 * access and data download after that.
 *
 * The care details (who needs care, care types, budget) live at /client/profile.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getViewer } from '@/lib/viewer';
import { AvatarUpload } from '@/components/cna/AvatarUpload';
import { AccountForm } from '@/components/cna/AccountForm';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { CloseAccountButton } from '@/components/client/CloseAccountButton';

export const dynamic = 'force-dynamic';

const SECTIONS = [
  { href: '#account', icon: '👤', label: 'Account' },
  { href: '#notifications', icon: '🔔', label: 'Notifications' },
  { href: '#security', icon: '🔒', label: 'Security' },
  { href: '#family', icon: '👪', label: 'Family access' },
  { href: '#danger', icon: '🗑️', label: 'Close account', danger: true },
];

const NOTIF_ROWS = [
  { title: 'Messages from caregivers', sub: 'New messages and replies' },
  { title: 'Applications to your jobs', sub: 'When a caregiver applies to something you posted' },
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

export default async function ClientAccountPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('users').select('full_name, email, phone, avatar_url, created_at').eq('id', user.id).single();

  const fullName = me?.full_name ?? '';
  const first = fullName.split(' ')[0] ?? '';
  const last = fullName.split(' ').slice(1).join(' ');
  const memberSince = me?.created_at ? new Date(me.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;
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
            <div className="font-medium text-ink mb-1">Care details vs. settings</div>
            Who needs care, the care you need and your budget live in{' '}
            <Link href="/client/profile" className="text-deepteal hover:text-coral">Care details</Link>.
          </div>
        </aside>

        <section className="min-w-0 lg:col-span-9 space-y-6 fade-up" style={{ animationDelay: '.1s' }}>
          <div id="account" className={card}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-8 pb-6 border-b border-ink/10">
              <AvatarUpload
                userId={user.id}
                photoUrl={me?.avatar_url ?? null}
                initials={initials(fullName || 'K')}
                avatarClass={avatarClass(fullName)}
                who="family"
              />
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl font-medium break-words">{fullName || 'Your name'}</div>
                <div className="text-xs text-ink/60 font-mono mt-1 break-all">{me?.email ?? ''}</div>
                {memberSince && <div className="text-xs text-ink/50 mt-1">On Kindred since {memberSince}</div>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Link href="/client/profile" className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">
                    Care details
                  </Link>
                  <Link href="/client/membership" className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">
                    Membership
                  </Link>
                </div>
              </div>
            </div>
            <h3 className="font-display text-xl font-medium mb-4">Personal info</h3>
            <AccountForm first={first} last={last} email={me?.email ?? ''} phone={me?.phone ?? ''} who="family" />
          </div>

          <div id="notifications" className={card}>
            <SectionHead
              title="Notifications"
              sub="Kindred doesn't send notifications yet. When it does, you'll choose here how you hear about each of these."
              soon
            />
            <fieldset disabled className="opacity-60">
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
                      {ch}
                    </label>
                  ))}
                </div>
              ))}
            </fieldset>
          </div>

          <div id="security" className={card}>
            <SectionHead title="Security & sign-in" sub="Lock down your account." />
            <div className="space-y-4">
              <div className="border-b border-ink/10 pb-4">
                <ChangePasswordForm />
              </div>
              {[
                { title: 'Two-step sign-in', sub: 'A code by text or an authenticator app' },
                { title: 'Where you’re signed in', sub: 'See and sign out other devices' },
              ].map((row, i, arr) => (
                <div key={row.title} className={`flex items-center justify-between gap-3 ${i < arr.length - 1 ? 'border-b border-ink/10 pb-4' : ''}`}>
                  <div className="min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2">{row.title} <ComingSoon /></div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="family" className={card}>
            <SectionHead
              title="Family access"
              sub="Let a sibling or spouse see the conversations and help choose a caregiver, on their own sign-in."
              soon
            />
          </div>

          <div id="danger" className="bg-coral/5 border border-coral/30 rounded-2xl p-5 sm:p-6 scroll-mt-28">
            <h3 className="font-display text-xl font-medium mb-1 text-coral">Close account</h3>
            <p className="text-sm text-ink/70 leading-relaxed mb-4 max-w-2xl">
              This deletes your account, care details, saved caregivers and messages. If you have a membership, cancel it
              on your <Link href="/client/membership" className="text-deepteal underline">Membership page</Link> first.
            </p>
            <CloseAccountButton />
          </div>

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
