/**
 * /cna/settings — account settings. Ported 1:1 from CNA-Portal/settings.html.
 *
 * DATA NOTE: The account section is populated with the caregiver's REAL name
 * and email. Everything else (notification toggles, security, privacy,
 * preferences) is UI only and none of it persists
 * yet (no settings tables wired). Toggle switches are pure CSS (checkbox), so
 * they flip visually but don't save. Save buttons are stubs. Fields we don't
 * store yet start empty rather than showing invented values.
 *
 * There is no payout section: Kindred doesn't pay caregivers. Families pay
 * caregivers directly, and Kindred only bills its own membership.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from '@/app/(auth)/actions';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

const SIDE_LINKS = [
  { href: '#account', icon: '👤', label: 'Account', active: true },
  { href: '#notifications', icon: '🔔', label: 'Notifications' },
  { href: '#security', icon: '🔒', label: 'Security' },
  { href: '#privacy', icon: '🛡️', label: 'Privacy' },
  { href: '#prefs', icon: '⚙️', label: 'Preferences' },
  { href: '#danger', icon: '🗑️', label: 'Close account', danger: true },
];

const NOTIF_ROWS = [
  { title: 'New job matches', sub: 'Jobs that match your services & area', inApp: true, email: true, sms: false },
  { title: 'Application accepted', sub: 'A client approved your application', inApp: true, email: true, sms: true },
  { title: 'Messages from clients', sub: 'New chat replies', inApp: true, email: false, sms: true },
  { title: 'Membership and Kindred Standard', sub: 'Renewals and anything that needs your attention', inApp: true, email: true, sms: false },
  { title: 'Reviews & ratings', sub: 'When clients leave you a review', inApp: true, email: true, sms: false },
  { title: 'Kindred newsletter', sub: 'Monthly tips, meetups, new features', inApp: false, email: true, sms: false },
];

function Toggle({ on }: { on: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" defaultChecked={on} />
      <span className="slider" />
    </label>
  );
}

export default async function CnaSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name, email').eq('id', user.id).single(),
    supabase.from('cna_profiles').select('display_name, last_name').eq('user_id', user.id).maybeSingle(),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;
  const fullName = me?.full_name ?? 'Caregiver';
  const firstName = fullName.split(' ')[0];
  const lastName = profile?.last_name ?? fullName.split(' ').slice(1).join(' ');
  const displayName = profile?.display_name
    ? `${profile.display_name} ${(lastName ?? '').charAt(0)}.`.trim()
    : fullName;
  const userInitials = initials(fullName);
  const avClass = avatarClass(fullName);

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      <section className="mb-10 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Account</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Your <span className="italic font-medium text-gradient">settings.</span>
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Account details, notifications, security, and how Kindred talks to you.
        </p>
      </section>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* SIDEBAR */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start fade-up" style={{ animationDelay: '.05s' }}>
          <nav className="bg-white border border-ink/10 rounded-2xl p-3 space-y-1">
            {SIDE_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={`side-link ${l.active ? 'active' : ''} ${l.danger ? 'text-coral' : ''}`}>
                {l.icon} {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 bg-creamdark/70 border border-ink/10 rounded-2xl p-4 text-xs text-ink/70 leading-relaxed">
            <div className="font-medium text-ink mb-1">Profile vs. settings</div>
            Editing what families see? Head to{' '}
            <Link href="/cna/profile" className="text-deepteal hover:text-coral">My profile</Link> instead.
          </div>
        </aside>

        {/* CONTENT */}
        <section className="lg:col-span-9 space-y-6 fade-up" style={{ animationDelay: '.1s' }}>
          {/* ACCOUNT */}
          <div id="account" className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-ink/10">
              <div className={`w-20 h-20 rounded-3xl ${avClass} flex items-center justify-center text-cream font-display text-3xl font-medium`}>
                {userInitials}
              </div>
              <div className="flex-1">
                <div className="font-display text-2xl font-medium">{fullName}</div>
                <div className="text-xs text-ink/60 font-mono mt-1">{me?.email ?? ''}</div>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-4 py-2 bg-mist hover:bg-deepteal hover:text-cream border border-ink/15 rounded-full transition">
                    Change photo
                  </button>
                  <Link href="/cna/profile" className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">
                    Edit public profile
                  </Link>
                </div>
              </div>
            </div>

            <h3 className="font-display text-xl font-medium mb-4">Personal info</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Legal first name</label>
                <input className="kfield" defaultValue={firstName} />
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Legal last name</label>
                <input className="kfield" defaultValue={lastName} />
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Display name on profile</label>
                <input className="kfield" defaultValue={displayName} />
                <div className="text-[10px] text-ink/50 mt-1">Clients see this. Last name initial only for privacy.</div>
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Date of birth</label>
                <input className="kfield" type="date" />
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Email</label>
                <input className="kfield" type="email" defaultValue={me?.email ?? ''} />
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Phone</label>
                <input className="kfield" type="tel" placeholder="(555) 555-5555" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">
                  Home address (used for distance matching only, never shown to families)
                </label>
                <input className="kfield" placeholder="Street, city, ZIP" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="text-sm px-5 py-2 border border-ink/15 rounded-full hover:bg-mist transition">Cancel</button>
              <button className="text-sm px-5 py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition">Save changes</button>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div id="notifications" className="bg-white border border-ink/10 rounded-2xl p-6">
            <h3 className="font-display text-xl font-medium mb-1">Notifications</h3>
            <p className="text-sm text-ink/60 mb-5">How we reach you. Email + SMS preferences per category.</p>
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-ink/50">
                <div className="col-span-6">Notification</div>
                <div className="col-span-2 text-center">In-app</div>
                <div className="col-span-2 text-center">Email</div>
                <div className="col-span-2 text-center">SMS</div>
              </div>
              {NOTIF_ROWS.map((row) => (
                <div key={row.title} className="grid grid-cols-12 gap-4 px-3 py-3 items-center text-sm border-t border-ink/10">
                  <div className="col-span-6">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                  <div className="col-span-2 flex justify-center"><Toggle on={row.inApp} /></div>
                  <div className="col-span-2 flex justify-center"><Toggle on={row.email} /></div>
                  <div className="col-span-2 flex justify-center"><Toggle on={row.sms} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* SECURITY */}
          <div id="security" className="bg-white border border-ink/10 rounded-2xl p-6">
            <h3 className="font-display text-xl font-medium mb-1">Security &amp; sign-in</h3>
            <p className="text-sm text-ink/60 mb-5">Lock down your account.</p>
            <div className="space-y-4">
              {[
                { title: 'Password', sub: 'Change the password you sign in with', btn: 'Change' },
                { title: 'Two-factor auth (SMS)', sub: 'Coming soon', btn: 'Set up', badge: undefined as string | undefined },
                { title: 'Authenticator app', sub: 'Coming soon', btn: 'Set up' },
                { title: 'Active sessions', sub: 'See where you are signed in', btn: 'View all', last: true },
              ].map((row) => (
                <div key={row.title} className={`flex items-center justify-between ${row.last ? '' : 'border-b border-ink/10 pb-4'}`}>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {row.title}
                      {row.badge && <span className="text-[10px] bg-sage/20 text-deepteal px-2 py-0.5 rounded-full font-medium">{row.badge}</span>}
                    </div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                  <button className="text-sm px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">{row.btn}</button>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVACY */}
          <div id="privacy" className="bg-white border border-ink/10 rounded-2xl p-6">
            <h3 className="font-display text-xl font-medium mb-1">Privacy</h3>
            <p className="text-sm text-ink/60 mb-5">Control what clients see and what data we keep.</p>
            <div className="space-y-3">
              {[
                { title: 'Show me in client search results', sub: 'Turning this off hides your profile from new families (families you already talk with can still message you)', checked: true },
                { title: 'Show my photo to clients', sub: 'If off, your initials show instead', checked: true },
                { title: 'Hide my approximate location from public profile', sub: 'Families see your general area, not your neighborhood', checked: false },
                { title: 'Allow Kindred to use my anonymized data to improve matching', sub: 'Better job recommendations for you, never sold or shared with third parties', checked: true },
              ].map((row) => (
                <label key={row.title} className="flex items-start gap-3 p-3 hover:bg-mist/40 rounded-xl cursor-pointer">
                  <input type="checkbox" defaultChecked={row.checked} className="mt-0.5 rounded text-deepteal focus:ring-teal" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{row.title}</div>
                    <div className="text-xs text-ink/60">{row.sub}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-ink/10 flex flex-wrap gap-2">
              <button className="text-sm px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">📥 Download my data</button>
              <button className="text-sm px-4 py-2 border border-ink/15 rounded-full hover:bg-mist transition">View blocked clients (0)</button>
            </div>
          </div>

          {/* PREFERENCES */}
          <div id="prefs" className="bg-white border border-ink/10 rounded-2xl p-6">
            <h3 className="font-display text-xl font-medium mb-1">Preferences</h3>
            <p className="text-sm text-ink/60 mb-5">Make the app feel like yours.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Time zone</label>
                <select className="kfield">
                  <option>Eastern Time</option>
                  <option>Central Time</option>
                  <option>Mountain Time</option>
                  <option>Pacific Time</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Language</label>
                <select className="kfield">
                  <option>English (US)</option>
                  <option>Español</option>
                  <option>Haitian Creole</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Distance units</label>
                <select className="kfield">
                  <option>Miles</option>
                  <option>Kilometers</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/60 font-mono uppercase tracking-widest mb-1.5 block">Theme</label>
                <select className="kfield">
                  <option>System default</option>
                  <option>Light</option>
                  <option>Dark (coming soon)</option>
                </select>
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div id="danger" className="bg-coral/5 border border-coral/30 rounded-2xl p-6">
            <h3 className="font-display text-xl font-medium mb-1 text-coral">Close account</h3>
            <p className="text-sm text-ink/70 leading-relaxed mb-5 max-w-2xl">
              If you&rsquo;re going on extended leave or stepping away from caregiving, you can
              deactivate your account temporarily. Closing it permanently is also fine, though we keep
              membership billing records for as long as the law requires.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="text-sm px-4 py-2 border border-ink/15 bg-cream rounded-full hover:bg-mist transition">Pause my account</button>
              <button className="text-sm px-4 py-2 border border-coral/40 text-coral rounded-full hover:bg-coral hover:text-cream transition">Close account permanently</button>
            </div>
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
