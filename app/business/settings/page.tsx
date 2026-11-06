/**
 * /business/settings — facility settings. Ported from
 * Business-Portal/settings.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only:
 * • Facility profile fields pre-filled from real `organizations` row.
 * • Compliance docs (BAA, COI, vendor agreement, W-9, license, MSA) come from
 *   `organization_compliance_docs` for this org — uploaded ones link, missing
 *   ones show an explicit "Not on file yet" state instead of the mock's
 *   fabricated "Signed Nov 12, 2024" filler.
 * • Your-account fields pre-filled from real users row + member role.
 * • The preference-heavy panels (shift defaults, auto-approval, rate
 *   escalation, billing, notifications, integrations, security) render for
 *   visual parity — they need a per-org settings table to actually persist,
 *   which isn't wired yet. Save buttons exist but don't yet write.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/business';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

const ORG_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'alf', label: 'Assisted Living' },
  { value: 'memory_care', label: 'Memory Care' },
  { value: 'snf', label: 'Skilled Nursing (SNF)' },
  { value: 'hha', label: 'Home Health Agency' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'hospice', label: 'Hospice' },
  { value: 'independent_living', label: 'Independent Living' },
  { value: 'adult_day', label: 'Adult Day Program' },
  { value: 'other', label: 'Other' },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  scheduler: 'Scheduler',
  hr: 'HR',
  billing: 'Billing',
  supervisor: 'Supervisor',
};

const REQUIRED_DOC_TYPES: Array<{ type: string; label: string; sub: string; icon: string }> = [
  { type: 'msa', label: 'Master Services Agreement', sub: 'Sets the legal terms of using Kindred', icon: '📄' },
  { type: 'baa', label: 'Business Associate Agreement (HIPAA)', sub: 'Required to handle protected health info', icon: '📄' },
  { type: 'coi', label: 'Certificate of Insurance', sub: 'GL / Professional Liability', icon: '📄' },
  { type: 'w9', label: 'Kindred W-9', sub: 'For 1099 reporting on your side', icon: '📄' },
  { type: 'vendor_agreement', label: 'Vendor agreement', sub: 'Facility-specific terms', icon: '📄' },
  { type: 'license', label: 'Facility license', sub: 'State licensure on file', icon: '📄' },
];

export default async function BusinessSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await getBusinessContext();

  const { data: me } = await supabase.from('users').select('full_name, email, phone').eq('id', user.id).single();
  const fullName = me?.full_name ?? '';
  const firstName = fullName.split(' ')[0] || '';
  const userInitials = initials(fullName || me?.email || '?');
  const av = avatarClass(fullName || me?.email || '');
  const roleLabel = ctx?.role ? ROLE_LABEL[ctx.role] ?? ctx.role : '';

  let org:
    | { name: string; type: string; license_number: string | null; ein: string | null; address: string | null; city: string | null; state: string | null; zip: string | null; capacity: number | null; specialty: string | null; bio: string | null }
    | null = null;
  let docs: Array<{ id: string; type: string; file_url: string | null; uploaded_at: string; expires_at: string | null }> = [];

  if (ctx?.orgId) {
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('name, type, license_number, ein, address, city, state, zip, capacity, specialty, bio')
      .eq('id', ctx.orgId)
      .maybeSingle();
    org = orgRow;

    const { data: docRows } = await supabase
      .from('organization_compliance_docs')
      .select('id, type, file_url, uploaded_at, expires_at')
      .eq('org_id', ctx.orgId)
      .order('uploaded_at', { ascending: false });
    docs = docRows ?? [];
  }

  const docByType = new Map<string, (typeof docs)[number]>();
  docs.forEach((d) => {
    if (!docByType.has(d.type)) docByType.set(d.type, d);
  });

  const orgAddressLine = org
    ? [org.address, org.city, org.state, org.zip].filter(Boolean).join(', ')
    : '';

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12">
      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Settings</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Tune Kindred to <span className="italic font-medium text-gradient">your facility's rhythm.</span>
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Set defaults once and post shifts in seconds going forward. Compliance documents and your
          account live here too.
        </p>
      </section>

      <section className="grid lg:grid-cols-12 gap-6 fade-up" style={{ animationDelay: '.05s' }}>
        {/* SIDE NAV */}
        <aside className="lg:col-span-3">
          <nav className="bg-white border border-ink/10 rounded-2xl p-3 sticky top-28 space-y-1 text-sm">
            <a href="#facility" className="settings-nav-item active block px-3 py-2 rounded-lg">🏢 Facility profile</a>
            <a href="#shifts" className="settings-nav-item block px-3 py-2 rounded-lg">📋 Shift defaults</a>
            <a href="#approval" className="settings-nav-item block px-3 py-2 rounded-lg">✓ Auto-approval</a>
            <a href="#escalation" className="settings-nav-item block px-3 py-2 rounded-lg">📈 Rate escalation</a>
            <a href="#billing" className="settings-nav-item block px-3 py-2 rounded-lg">💳 Billing &amp; payment</a>
            <a href="#notifications" className="settings-nav-item block px-3 py-2 rounded-lg">🔔 Notifications</a>
            <a href="#integrations" className="settings-nav-item block px-3 py-2 rounded-lg">🔌 Integrations</a>
            <a href="#security" className="settings-nav-item block px-3 py-2 rounded-lg">🔒 Security &amp; SSO</a>
            <a href="#compliance" className="settings-nav-item block px-3 py-2 rounded-lg">📋 Compliance docs</a>
            <a href="#account" className="settings-nav-item block px-3 py-2 rounded-lg">👤 Your account</a>
          </nav>
        </aside>

        {/* PANELS */}
        <div className="lg:col-span-9 space-y-6">
          {/* FACILITY PROFILE */}
          <section id="facility" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Facility profile</div>
              <h2 className="font-display text-xl font-medium">What CNAs see when they consider your shift</h2>
            </div>
            {!org ? (
              <div className="rounded-2xl border border-dashed border-sage bg-sage/10 p-6 text-center">
                <p className="text-sm text-ink/70 mb-3">Your facility hasn't been set up yet. Add the basics below to start posting shifts.</p>
              </div>
            ) : null}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Facility name</label>
                <input defaultValue={org?.name ?? ''} placeholder="e.g. Magnolia Springs Assisted Living" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Facility type</label>
                <select defaultValue={org?.type ?? 'alf'} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal bg-white">
                  {ORG_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Address</label>
                <input defaultValue={orgAddressLine} placeholder="Street, City, State ZIP" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Bed count</label>
                <input type="number" defaultValue={org?.capacity ?? ''} placeholder="64" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">State license #</label>
                <input defaultValue={org?.license_number ?? ''} placeholder="AL-12345" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">EIN (for invoicing)</label>
                <input defaultValue={org?.ein ?? ''} placeholder="00-0000000" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Specialty (optional)</label>
                <input defaultValue={org?.specialty ?? ''} placeholder="e.g. Memory care, hospice support" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Public bio (shown to CNAs)</label>
                <textarea
                  rows={3}
                  defaultValue={org?.bio ?? ''}
                  placeholder="Tell caregivers what's special about working at your facility."
                  className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal leading-relaxed"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-deepteal text-cream px-5 py-2 rounded-full text-sm hover:bg-inkdark transition">Save changes</button>
            </div>
          </section>

          {/* SHIFT DEFAULTS (visual parity) */}
          <section id="shifts" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Shift defaults</div>
              <h2 className="font-display text-xl font-medium">Pre-fill the boring fields when you post</h2>
              <p className="text-sm text-ink/60 mt-1">
                Set the values that rarely change. Defaults aren't persisted yet — for now, set them per
                post in the bulk builder.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { label: 'Default Day bill rate', placeholder: '34.00' },
                { label: 'Default Swing bill rate', placeholder: '34.00' },
                { label: 'Default Eve bill rate', placeholder: '36.00' },
                { label: 'Default NOC bill rate', placeholder: '42.00' },
                { label: 'Memory care premium', placeholder: '4.00' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">$</span>
                    <input type="number" placeholder={f.placeholder} className="w-full pl-7 pr-12 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 font-mono">/hr</span>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Minimum CNA rating</label>
                <select className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal bg-white">
                  <option>Any (no minimum)</option>
                  <option>★ 4.0+</option>
                  <option defaultChecked>★ 4.5+</option>
                  <option>★ 4.7+</option>
                </select>
              </div>
            </div>
          </section>

          {/* AUTO-APPROVAL (visual parity) */}
          <section id="approval" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Auto-approval rules</div>
              <h2 className="font-display text-xl font-medium">When timesheets approve themselves</h2>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { name: 'Auto-approve clean timesheets', sub: 'Within tolerance & geofence', defaultOn: true },
                { name: 'Clock-in tolerance: ±10 min', sub: 'How close to scheduled times counts as "clean"', defaultOn: true },
                { name: 'Require GPS geofence verification', sub: 'Must clock in within 200ft of facility', defaultOn: true },
                { name: 'Auto-approve overtime (≤30 min)', sub: 'CNA stays past scheduled end without check-in', defaultOn: false },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between p-4 bg-mist/30 rounded-xl">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink/60">{r.sub}</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={r.defaultOn} className="sr-only peer" />
                    <div className="w-10 h-6 bg-mist rounded-full peer-checked:bg-deepteal transition relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full peer-checked:after:translate-x-4 after:transition-transform" />
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* RATE ESCALATION (visual parity) */}
          <section id="escalation" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Rate escalation</div>
              <h2 className="font-display text-xl font-medium">When shifts go unclaimed, raise the rate</h2>
              <p className="text-sm text-ink/60 mt-1">
                You set the ceiling. Kindred bumps the rate in small steps until the shift fills.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-mist/30 rounded-xl">
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Bump step</label>
                <select className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm bg-white">
                  <option>+$1/hr</option>
                  <option defaultChecked>+$2/hr</option>
                  <option>+$3/hr</option>
                  <option>+$5/hr</option>
                </select>
              </div>
              <div className="p-4 bg-mist/30 rounded-xl">
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Trigger after</label>
                <select className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm bg-white">
                  <option>6 hrs unclaimed</option>
                  <option>12 hrs unclaimed</option>
                  <option defaultChecked>24 hrs unclaimed</option>
                </select>
              </div>
            </div>
          </section>

          {/* BILLING (visual parity) */}
          <section id="billing" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Billing &amp; payment</div>
              <h2 className="font-display text-xl font-medium">How and when you pay</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Payment terms</label>
                <select defaultValue="Net-30 (default)" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm bg-white">
                  <option>Net-15</option>
                  <option>Net-30 (default)</option>
                  <option>Net-45 (contact AM)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Billing cycle</label>
                <select defaultValue="Monthly (1st of month)" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm bg-white">
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly (1st of month)</option>
                </select>
              </div>
              <div className="md:col-span-2 p-4 bg-mist/30 rounded-xl">
                <div className="text-sm font-medium mb-1">Payment method</div>
                <div className="text-xs text-ink/60">No ACH set up yet. Stripe Connect onboarding is on the build tracker (Backend → Stripe Connect setup).</div>
              </div>
            </div>
          </section>

          {/* NOTIFICATIONS (visual parity) */}
          <section id="notifications" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Notifications</div>
              <h2 className="font-display text-xl font-medium">What pings you and how</h2>
            </div>
            <p className="text-sm text-ink/60">
              Per-event notification preferences (in-app, email, SMS) need a preferences table to
              persist. Coming once the notification system is wired.
            </p>
          </section>

          {/* INTEGRATIONS (visual parity) */}
          <section id="integrations" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Integrations</div>
              <h2 className="font-display text-xl font-medium">Connect Kindred to the rest of your stack</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: 'PointClickCare', sub: 'EHR · two-way sync', icon: '📊' },
                { name: 'Google Calendar', sub: 'Push confirmed shifts', icon: '🗓' },
                { name: 'Outlook / Microsoft 365', sub: 'Push confirmed shifts', icon: '📨' },
                { name: 'OnShift', sub: 'Internal scheduling', icon: '📋' },
                { name: 'QuickBooks Online', sub: 'Auto-sync invoices to AP', icon: '💰' },
                { name: 'CSV / iCal export', sub: 'Always available · no setup', icon: '📥' },
              ].map((i) => (
                <div key={i.name} className="border border-ink/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{i.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{i.name}</div>
                      <div className="text-xs text-ink/60">{i.sub}</div>
                    </div>
                  </div>
                  <span className="text-xs text-ink/50 font-mono">Coming soon</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECURITY (visual parity) */}
          <section id="security" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Security &amp; SSO</div>
              <h2 className="font-display text-xl font-medium">Keep your team's access locked down</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-4 bg-mist/30 rounded-xl">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-xs text-ink/60">Change anytime</div>
                </div>
                <button className="text-xs text-deepteal hover:text-coral">Change password</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-mist/30 rounded-xl">
                <div>
                  <div className="font-medium">Two-factor authentication</div>
                  <div className="text-xs text-ink/60">Authenticator app or SMS</div>
                </div>
                <button className="text-xs text-deepteal hover:text-coral">Set up</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-mist/30 rounded-xl">
                <div>
                  <div className="font-medium">SAML SSO (Microsoft 365 / Okta)</div>
                  <div className="text-xs text-ink/60">Enterprise plans</div>
                </div>
                <span className="text-xs text-ink/50 font-mono">Coming soon</span>
              </div>
            </div>
          </section>

          {/* COMPLIANCE — REAL DOCS */}
          <section id="compliance" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Compliance documents</div>
                <h2 className="font-display text-xl font-medium">For auditors, attorneys, and your own files</h2>
              </div>
              <button className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist">+ Upload document</button>
            </div>

            <div className="space-y-2">
              {REQUIRED_DOC_TYPES.map((rd) => {
                const doc = docByType.get(rd.type);
                const onFile = !!doc;
                return (
                  <div key={rd.type} className="flex items-center justify-between p-4 border border-ink/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{rd.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{rd.label}</div>
                        <div className="text-xs text-ink/60">
                          {onFile && doc?.uploaded_at
                            ? `On file · uploaded ${new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${doc.expires_at ? ` · expires ${new Date(doc.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}`
                            : `${rd.sub} · not on file yet`}
                        </div>
                      </div>
                    </div>
                    {onFile && doc?.file_url ? (
                      <a href={doc.file_url} className="text-xs text-deepteal hover:text-coral">Download →</a>
                    ) : (
                      <button className="text-xs px-3 py-1.5 border border-deepteal text-deepteal rounded-full hover:bg-deepteal hover:text-cream transition">
                        Upload
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {docs.length === 0 && (
              <p className="text-xs text-ink/50 mt-4">
                No compliance documents on file yet. We'll prompt you for these during onboarding.
              </p>
            )}
          </section>

          {/* YOUR ACCOUNT */}
          <section id="account" className="bg-white border border-ink/10 rounded-2xl p-6 lg:p-7">
            <div className="mb-5">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Your account</div>
              <h2 className="font-display text-xl font-medium">{firstName ? `Just your personal stuff, ${firstName}` : 'Your profile'}</h2>
            </div>

            <div className="flex items-center gap-4 pb-5 border-b border-ink/10 mb-5">
              <div className={`w-16 h-16 rounded-full ${av} flex items-center justify-center text-cream font-display text-xl font-medium`}>
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl font-medium truncate">{fullName || 'Add your name'}</div>
                <div className="text-sm text-ink/60">{roleLabel ? `${roleLabel} role` : '—'}</div>
              </div>
              <button className="text-xs px-3 py-1.5 border border-ink/15 rounded-full hover:bg-mist">Change photo</button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Full name</label>
                <input defaultValue={fullName} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Work email</label>
                <input type="email" defaultValue={me?.email ?? ''} className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Mobile</label>
                <input type="tel" defaultValue={me?.phone ?? ''} placeholder="(352) 555-0000" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm focus:outline-none focus:border-teal" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-ink/50 mb-1.5">Timezone</label>
                <select defaultValue="Eastern (ET)" className="w-full px-3.5 py-2.5 border border-ink/15 rounded-xl text-sm bg-white">
                  <option>Eastern (ET)</option>
                  <option>Central (CT)</option>
                  <option>Mountain (MT)</option>
                  <option>Pacific (PT)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-ink/60 font-mono">Sign-in history shows up here once auth logging is on.</div>
              <div className="flex gap-2">
                <button className="text-xs px-4 py-2 border border-ink/15 rounded-full hover:bg-mist">Change password</button>
                <button className="text-xs px-4 py-2 border border-coral/30 text-coral rounded-full hover:bg-coral hover:text-cream transition">Sign out everywhere</button>
              </div>
            </div>
          </section>

          {/* DANGER ZONE */}
          <section className="border border-coral/30 bg-coral/5 rounded-2xl p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-coral mb-2">⚠ Danger zone</div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-display text-lg font-medium mb-1">Cancel Kindred for this facility</div>
                <p className="text-sm text-ink/70 max-w-xl">
                  This closes your facility account, cancels all open shifts, and removes your roster
                  CNAs' access to your shifts. Outstanding invoices remain due. Cannot be undone —
                  talk to your account manager first.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/business/messages" className="text-xs px-4 py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition">
                  Message AM first
                </Link>
                <button className="text-xs px-4 py-2 border border-coral text-coral rounded-full hover:bg-coral hover:text-cream transition">
                  Begin cancellation
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
