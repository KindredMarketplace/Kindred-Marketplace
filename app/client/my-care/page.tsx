/**
 * /client/my-care — the care plan for the family's care recipient. Ported from
 * Client-Portal/my-care.html. Shell lives in app/client/layout.tsx.
 *
 * Real-data-only: every field comes from care_recipients / client_profiles for
 * THIS user. Where the recipient has no data for a section, we show a quiet
 * empty state instead of the mock's Eleanor filler. If there's no care
 * recipient at all, we show a setup nudge.
 *
 * The tab bar (About / Routines / Documents / Care history / Family access) is
 * rendered for visual parity; only About + Routines have real data wired today.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { initials, avatarClass } from '@/lib/utils/avatar';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

function age(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default async function ClientMyCarePage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [profileRes, recipientsRes] = await Promise.all([
    supabase.from('client_profiles').select('name, street_address, city, state, zip').eq('user_id', user.id).maybeSingle(),
    supabase.from('care_recipients').select('*').eq('client_id', user.id),
  ]);

  const profile = profileRes.data;
  const recipient = recipientsRes.data?.[0] ?? null;

  // No recipient yet → setup nudge.
  if (!recipient) {
    return (
      <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Care plan</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Everything about the person you're caring for, <span className="italic font-medium text-gradient">in one place.</span>
          </h1>
        </section>
        <section className="fade-up" style={{ animationDelay: '.1s' }}>
          <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
            <div className="text-3xl mb-3">📋</div>
            <h2 className="font-display text-2xl font-medium mb-2">No care recipient added yet</h2>
            <p className="text-sm text-ink/70 max-w-md mx-auto mb-5">
              Add the person you're caring for — their conditions, medications, allergies, and
              routines. This is exactly what caregivers see once you've hired them.
            </p>
            <Link href="/client/profile" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Add a care recipient
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const first = recipient.name.split(' ')[0];
  const recipientAge = age(recipient.date_of_birth);
  const recipientInitials = initials(recipient.name);
  const recipientAv = avatarClass(recipient.name);
  const addressParts = [profile?.street_address, profile?.city, profile?.state, profile?.zip].filter(Boolean);
  const addressText = addressParts.length ? addressParts.join(', ') : null;

  const conditions: string[] = recipient.conditions ?? [];
  const allergies: string[] = recipient.allergies ?? [];
  const medications: string[] = recipient.medications ?? [];

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14 relative">
      {/* HEADER */}
      <section className="mb-8 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Care plan</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Everything about <span className="italic font-medium text-gradient">{first}</span>, in one place.
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            This is what caregivers see when they're assigned. Keep it current — small details make a
            big difference.
          </p>
        </div>
        <Link href="/client/profile" className="bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition flex items-center gap-2">
          <span>✎</span> Edit details
        </Link>
      </section>

      {/* TOP PROFILE CARD */}
      <section className="mb-8 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-ink/10 rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-deepteal via-teal to-sky h-32 relative grain" />
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex items-end gap-6 flex-wrap">
              <div className={`w-32 h-32 rounded-3xl ${recipientAv} ring-4 ring-cream flex items-center justify-center text-cream font-display text-5xl font-medium shadow-xl`}>
                {recipientInitials}
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Care recipient</div>
                <h2 className="font-display text-3xl lg:text-4xl font-medium">{recipient.name}</h2>
                <div className="text-ink/70 text-sm mt-1.5 flex flex-wrap items-center gap-2">
                  {recipientAge != null && <span>{recipientAge} years old</span>}
                  {recipientAge != null && addressText && <span className="opacity-40">·</span>}
                  {addressText && <span className="font-mono text-coral">📍 {addressText}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TABS (visual parity; About + Routines wired) */}
      <section className="mb-6 fade-up" style={{ animationDelay: '.15s' }}>
        <div className="border-b border-ink/10 flex gap-1 overflow-x-auto no-scrollbar">
          <button className="px-5 py-3 text-sm border-b-2 tab-active whitespace-nowrap">About</button>
          <button className="px-5 py-3 text-sm border-b-2 border-transparent text-ink/60 hover:text-ink whitespace-nowrap transition">Routines</button>
          <button className="px-5 py-3 text-sm border-b-2 border-transparent text-ink/40 whitespace-nowrap" disabled>Documents</button>
          <button className="px-5 py-3 text-sm border-b-2 border-transparent text-ink/40 whitespace-nowrap" disabled>Care history</button>
          <button className="px-5 py-3 text-sm border-b-2 border-transparent text-ink/40 whitespace-nowrap" disabled>Family access</button>
        </div>
      </section>

      {/* ABOUT GRID */}
      <section className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* LEFT: Health */}
        <div className="lg:col-span-2 space-y-6 fade-up" style={{ animationDelay: '.2s' }}>
          {/* Conditions */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Health</div>
                <h3 className="font-display text-xl font-medium">Conditions</h3>
              </div>
              <Link href="/client/profile" className="text-xs text-deepteal hover:text-coral">+ Add</Link>
            </div>
            {conditions.length > 0 ? (
              <div className="space-y-3">
                {conditions.map((c) => (
                  <div key={c} className="flex items-start gap-3 p-3 rounded-xl border border-ink/10">
                    <div className="w-2 h-2 rounded-full bg-coral mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{c.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/50">No conditions listed yet.</p>
            )}
          </div>

          {/* Medications */}
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Daily medications</div>
                <h3 className="font-display text-xl font-medium">Meds &amp; supplements</h3>
              </div>
              <Link href="/client/profile" className="text-xs text-deepteal hover:text-coral">+ Add</Link>
            </div>
            {medications.length > 0 ? (
              <div className="space-y-2">
                {medications.map((m) => (
                  <div key={m} className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 text-sm">
                    <div className="font-medium">{m}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/50">No medications listed yet.</p>
            )}
          </div>

          {/* Allergies */}
          <div className="bg-coral/5 border border-coral/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-coral mb-1">⚠ Important</div>
                <h3 className="font-display text-xl font-medium">Allergies &amp; sensitivities</h3>
              </div>
              <Link href="/client/profile" className="text-xs text-deepteal hover:text-coral">+ Add</Link>
            </div>
            {allergies.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {allergies.map((a) => (
                  <div key={a} className="bg-cream border border-coral/30 rounded-xl p-3">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span>⚠</span> {a}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/60">No allergies listed. If there are any, please add them — caregivers rely on this.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Preferences + quick info */}
        <div className="space-y-6 fade-up" style={{ animationDelay: '.25s' }}>
          <div className="bg-white border border-ink/10 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">What {first} likes</div>
            <h3 className="font-display text-xl font-medium mb-4">Preferences</h3>
            {recipient.preferences ? (
              <div className="text-sm text-ink/80 leading-relaxed p-3 rounded-xl border border-ink/10">
                {recipient.preferences}
              </div>
            ) : (
              <p className="text-sm text-ink/50">No preferences added yet.</p>
            )}
          </div>

          <div className="bg-creamdark/60 border border-ink/10 rounded-2xl p-6">
            <h3 className="font-display text-lg font-medium mb-3">Quick reference</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Name</dt>
                <dd className="font-mono text-xs">{recipient.name}</dd>
              </div>
              {recipient.date_of_birth && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Date of birth</dt>
                  <dd className="font-mono text-xs">{new Date(recipient.date_of_birth).toLocaleDateString()}</dd>
                </div>
              )}
              {profile?.zip && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">ZIP</dt>
                  <dd className="font-mono text-xs">{profile.zip}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* ROUTINES */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.3s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">A day in the life</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Routines</h2>
          </div>
          <Link href="/client/profile" className="text-xs text-deepteal hover:text-coral">+ Add routine</Link>
        </div>
        {recipient.routines ? (
          <div className="bg-white border border-ink/10 rounded-2xl p-6 text-sm text-ink/80 leading-relaxed whitespace-pre-line">
            {recipient.routines}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-10 text-center">
            <div className="text-3xl mb-3">🗓️</div>
            <h3 className="font-display text-xl font-medium mb-1">No routines added yet</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto">
              Describe {first}'s typical morning, afternoon, and evening so caregivers know what to
              expect.
            </p>
          </div>
        )}
      </section>

      {/* NOTES TO CAREGIVERS */}
      {recipient.notes && (
        <section className="fade-up" style={{ animationDelay: '.35s' }}>
          <div className="bg-gradient-to-br from-butter/30 to-coral/15 border border-coral/20 rounded-2xl p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💛</div>
              <div className="flex-1">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-1">
                  From {profile?.name?.split(' ')[0] ?? 'the family'}
                </div>
                <h3 className="font-display text-xl font-medium mb-3">Notes for caregivers</h3>
                <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{recipient.notes}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
