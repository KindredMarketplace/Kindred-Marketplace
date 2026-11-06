/**
 * /client/account — Account settings ("Account settings" in the profile dropdown).
 *
 * Ported from Client-Portal/profile.html: a left sidebar settings-nav plus
 * right-side panels — Account & profile, Notifications, Privacy & data,
 * Security, Family access, Payment methods, and the Pause/Close danger zone.
 *
 * Real-data-only: the Account panel is pre-filled from users + client_profiles.
 * Notifications / privacy / security toggles are visual for now (no prefs table
 * wired yet) — matching the original port. The Close-account button is LIVE via
 * <CloseAccountButton/>.
 *
 * The care profile (who needs care, care types, budget, etc.) lives separately
 * at /client/profile.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { CloseAccountButton } from '@/components/client/CloseAccountButton';

export const dynamic = 'force-dynamic';

const RELATIONSHIPS = ['Adult child (parent)', 'Spouse', 'Sibling', 'Self', 'Other'];

export default async function ClientAccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [userRes, profileRes] = await Promise.all([
    supabase.from('users').select('full_name, email, phone, created_at, username').eq('id', user.id).single(),
    supabase
      .from('client_profiles')
      .select('name, primary_contact_phone, street_address, city, state, zip, relationship_to_recipient')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const me = userRes.data;
  const profile = profileRes.data;

  const fullName = profile?.name || me?.full_name || '';
  const firstName = fullName.split(' ')[0] || '';
  const userInitials = initials(fullName || me?.username || '?');
  const avClass = avatarClass(fullName || me?.username || '');
  const phone = profile?.primary_contact_phone ?? me?.phone ?? '';
  const addressParts = [profile?.street_address, profile?.city, profile?.state, profile?.zip].filter(Boolean);
  const addressText = addressParts.join(', ');
  const memberSince = me?.created_at
    ? new Date(me.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-10 lg:py-14">
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Account</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Your <span className="italic font-medium text-gradient">account</span> &amp; preferences.
        </h1>
      </section>

      <div className="grid lg:grid-cols-12 gap-8 fade-up" style={{ animationDelay: '.1s' }}>
        {/* SETTINGS NAV */}
        <aside className="lg:col-span-3">
          <nav className="bg-white border border-ink/10 rounded-2xl overflow-hidden sticky top-24">
            <a href="#account" className="settings-nav-item active relative block px-5 py-3 text-sm border-b border-ink/5">Account &amp; profile</a>
            <a href="#notifications" className="settings-nav-item relative block px-5 py-3 text-sm border-b border-ink/5">Notifications</a>
            <a href="#privacy" className="settings-nav-item relative block px-5 py-3 text-sm border-b border-ink/5">Privacy &amp; data</a>
            <a href="#security" className="settings-nav-item relative block px-5 py-3 text-sm border-b border-ink/5">Security &amp; sign-in</a>
            <a href="#family" className="settings-nav-item relative block px-5 py-3 text-sm border-b border-ink/5">Family access</a>
            <Link href="/client/billing" className="settings-nav-item relative block px-5 py-3 text-sm border-b border-ink/5">Payment methods</Link>
            <Link href="/client/profile" className="settings-nav-item relative block px-5 py-3 text-sm border-b border-ink/5">Care profile →</Link>
            <a href="#danger" className="settings-nav-item relative block px-5 py-3 text-sm text-coral">Pause or close</a>
          </nav>
        </aside>

        {/* PANELS */}
        <section className="lg:col-span-9 space-y-6">
          {/* ACCOUNT — real data */}
          <div id="account" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8">
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-ink/10">
              <div className={`w-20 h-20 rounded-3xl ${avClass} flex items-center justify-center text-cream font-display text-3xl font-medium`}>
                {userInitials}
              </div>
              <div className="flex-1">
                <div className="font-display text-2xl font-medium">{fullName || 'Your name'}</div>
                <div className="text-sm text-ink/60 mt-0.5">
                  {me?.username && <span className="font-mono">@{me.username}</span>}
                  {memberSince && <> · Member since {memberSince}</>}
                </div>
              </div>
              <button className="text-sm border border-ink/15 px-4 py-2 rounded-full hover:bg-mist transition">Change photo</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Full name</label>
                <input type="text" defaultValue={fullName} className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Preferred name</label>
                <input type="text" defaultValue={firstName} className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Phone</label>
                <input type="tel" defaultValue={phone} placeholder="(352) 555-0000" className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Relationship to care recipient</label>
                <select
                  defaultValue={profile?.relationship_to_recipient ?? RELATIONSHIPS[0]}
                  className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal"
                >
                  {RELATIONSHIPS.map((r) => (<option key={r}>{r}</option>))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Home address (where care happens)</label>
                <input type="text" defaultValue={addressText} placeholder="Street, City, State ZIP" className="w-full px-4 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
                <p className="text-xs text-ink/60 mt-1.5">Caregivers only see this once you&rsquo;ve booked them.</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-ink/10 flex justify-end gap-3">
              <button className="px-5 py-2 text-sm border border-ink/15 rounded-full hover:bg-mist transition">Cancel</button>
              <button className="bg-deepteal text-cream px-5 py-2 rounded-full text-sm hover:bg-inkdark transition">Save changes</button>
            </div>
            <p className="text-xs text-ink/45 mt-3 text-right">Account-detail saving is wired next — care profile saves live today.</p>
          </div>

          {/* NOTIFICATIONS */}
          <div id="notifications" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Notifications</div>
            <h2 className="font-display text-2xl font-medium mb-1">How should we reach you?</h2>
            <p className="text-sm text-ink/60 mb-6">Pick what matters. We don&rsquo;t bother you with anything else.</p>

            <div className="space-y-3">
              {[
                { title: 'New message from caregiver', sub: 'When any caregiver messages you', email: true, sms: true, push: true },
                { title: 'Visit reminders', sub: '1 hour before each scheduled visit', email: false, sms: true, push: true },
                { title: 'New applicants for your jobs', sub: 'When a CNA applies to a job you\u2019ve posted', email: true, sms: false, push: true },
                { title: 'Billing & invoices', sub: 'Receipts, monthly summaries, payment issues', email: true, sms: false, push: false },
                { title: 'Caregiving tips & community', sub: 'Monthly newsletter (we keep it short)', email: false, sms: false, push: false },
              ].map((row) => (
                <div key={row.title} className="flex items-center justify-between p-4 border border-ink/10 rounded-xl">
                  <div>
                    <div className="font-medium text-sm">{row.title}</div>
                    <div className="text-xs text-ink/60 mt-0.5">{row.sub}</div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked={row.email} className="rounded text-deepteal" /> Email</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked={row.sms} className="rounded text-deepteal" /> SMS</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked={row.push} className="rounded text-deepteal" /> Push</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVACY & DATA */}
          <div id="privacy" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Privacy &amp; data</div>
            <h2 className="font-display text-2xl font-medium mb-1">Your data, your call</h2>
            <p className="text-sm text-ink/60 mb-6">Control what&rsquo;s visible and what we keep.</p>

            <div className="space-y-3">
              {[
                { title: 'Show my profile to caregivers I haven\u2019t hired', sub: 'Lets nearby CNAs see your job needs', on: true },
                { title: 'Share care details with assigned caregivers only', sub: 'PHI stays locked to your hired caregiver', on: true },
                { title: 'Allow Kindred to use anonymized data to improve matching', sub: 'Never sold, never shared with third parties', on: false },
              ].map((row) => (
                <div key={row.title} className="flex items-center justify-between p-4 border border-ink/10 rounded-xl">
                  <div className="pr-4">
                    <div className="font-medium text-sm">{row.title}</div>
                    <div className="text-xs text-ink/60 mt-0.5">{row.sub}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" defaultChecked={row.on} className="sr-only peer" />
                    <div className="w-10 h-6 bg-ink/15 peer-checked:bg-deepteal rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="text-sm text-deepteal hover:text-coral">Download my data</button>
              <span className="text-ink/20">·</span>
              <Link href="/privacy" className="text-sm text-deepteal hover:text-coral">Read our privacy policy</Link>
            </div>

            {/* Accessibility — coming soon, per Nick's note */}
            <div className="mt-6 pt-5 border-t border-ink/10">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/40 mb-3">Accessibility</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Dark mode', 'High-contrast mode', 'Color-blind friendly palette', 'Larger text'].map((label) => (
                  <div key={label} className="flex items-center justify-between p-3 border border-dashed border-ink/15 rounded-xl text-sm text-ink/55">
                    <span>{label}</span>
                    <span className="text-[10px] font-mono bg-creamdark px-2 py-0.5 rounded-full">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div id="security" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Security</div>
            <h2 className="font-display text-2xl font-medium mb-1">Sign-in &amp; security</h2>
            <p className="text-sm text-ink/60 mb-6">Keep your account — and your family&rsquo;s information — protected.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-ink/10 rounded-xl">
                <div>
                  <div className="font-medium text-sm">Password</div>
                  <div className="text-xs text-ink/60 mt-0.5">Change it any time</div>
                </div>
                <button className="text-sm text-deepteal hover:text-coral">Change password</button>
              </div>
              <div className="flex items-center justify-between p-4 border border-ink/10 rounded-xl">
                <div>
                  <div className="font-medium text-sm">Two-factor authentication</div>
                  <div className="text-xs text-ink/60 mt-0.5">Add a second step at sign-in for extra safety</div>
                </div>
                <button className="text-sm text-deepteal hover:text-coral">Set up</button>
              </div>
              <div className="flex items-center justify-between p-4 border border-ink/10 rounded-xl">
                <div>
                  <div className="font-medium text-sm">Active sessions</div>
                  <div className="text-xs text-ink/60 mt-0.5">See where you&rsquo;re signed in</div>
                </div>
                <button className="text-sm text-deepteal hover:text-coral">View all</button>
              </div>
            </div>
          </div>

          {/* FAMILY ACCESS */}
          <div id="family" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Family access</div>
            <h2 className="font-display text-2xl font-medium mb-1">Share with family</h2>
            <p className="text-sm text-ink/60 mb-6">Add a sibling or co-caregiver so they can see updates and message the caregivers too.</p>

            <div className="rounded-xl border border-dashed border-ink/20 p-6 text-center mb-4">
              <p className="text-sm text-ink/60">No family members added yet.</p>
            </div>

            <button className="w-full p-4 border-2 border-dashed border-ink/20 rounded-xl hover:border-teal hover:bg-mist/30 transition text-sm text-ink/70">
              + Invite a family member
            </button>
            <p className="text-xs text-ink/50 mt-3">Multiple-family-member access is on the roadmap (Client Portal, P2).</p>
          </div>

          {/* DANGER */}
          <div id="danger" className="bg-coral/5 border border-coral/30 rounded-2xl p-6 lg:p-8">
            <div className="font-display text-xl font-medium mb-2">Pause or close your account</div>
            <p className="text-sm text-ink/70 mb-4 max-w-xl">
              Going on a long trip? Pause notifications without canceling. Need to close everything? We&rsquo;re here to help.
            </p>
            <div className="flex flex-wrap gap-3 items-start">
              <button className="px-5 py-2 text-sm border border-coral/40 rounded-full hover:bg-coral hover:text-cream transition">Pause notifications</button>
              <CloseAccountButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
