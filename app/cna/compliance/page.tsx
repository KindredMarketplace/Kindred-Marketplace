/**
 * /cna/compliance — credential vault. Ported 1:1 from CNA-Portal/compliance.html.
 *
 * DATA NOTE: Real data is used for the CNA License (number + verified status),
 * Background check status, and Tier. Everything else (CPR, immunizations,
 * references, optional certs, the "expiring soon" alert) is realistic STATIC
 * filler — there's no documents/credentials-expiry system wired yet. Filler
 * blocks are marked FILLER.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TIER_LABEL: Record<string, string> = {
  new: 'New',
  verified: 'Verified',
  top_rated: 'Top-Rated',
};
const TIER_FEE: Record<string, string> = {
  new: '15% service fee',
  verified: '12% service fee',
  top_rated: '10% service fee',
};

export default async function CnaCompliancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('cna_profiles')
    .select('license_number, license_verified_at, license_expires_at, bg_check_status, bg_check_completed_at, tier')
    .eq('user_id', user.id)
    .maybeSingle();

  const tier = profile?.tier ?? 'new';
  const tierLabel = TIER_LABEL[tier] ?? tier;
  const licenseVerified = Boolean(profile?.license_verified_at);
  const bgClear = profile?.bg_check_status === 'clear';

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-10 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Compliance vault</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Your <span className="italic font-medium text-gradient">credentials</span>, kept current.
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            Everything that proves you&rsquo;re qualified to do this work. We track expiration dates
            so you never lose tier.
          </p>
        </div>
        <button className="bg-deepteal text-cream px-5 py-2.5 text-sm rounded-full hover:bg-inkdark transition flex items-center gap-2">
          <span>+</span> Upload document
        </button>
      </section>

      {/* STATUS OVERVIEW — tier real, rest FILLER */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Tier status</div>
          <div className="font-display text-2xl font-medium mt-1">{tierLabel}</div>
          <div className="text-xs text-ink/60 mt-1">{TIER_FEE[tier]}</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Docs uploaded</div>
          <div className="font-display text-3xl font-medium mt-1 text-deepteal">7 / 9</div>
          <div className="text-xs text-ink/60 mt-1">2 optional missing</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Expiring soon</div>
          <div className="font-display text-3xl font-medium mt-1 text-coral">1</div>
          <div className="text-xs text-ink/60 mt-1">CPR · 30 days</div>
        </div>
        <div className="bg-white border border-ink/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-mono">Last verified</div>
          <div className="font-display text-2xl font-medium mt-1">{bgClear ? fmtDate(profile?.bg_check_completed_at) : 'Mar 8'}</div>
          <div className="text-xs text-ink/60 mt-1">Annual review</div>
        </div>
      </section>

      {/* CRITICAL ALERT — FILLER */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-coral/5 border border-coral/30 rounded-2xl p-5 flex items-center gap-5 flex-wrap">
          <div className="text-3xl">⚠️</div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-display text-lg font-medium">CPR certification expires in 30 days</div>
            <p className="text-xs text-ink/70 mt-1">
              Renew before June 14 to stay Verified. Without an active CPR cert, you drop to the New
              tier (15% fee) and stop appearing in client searches.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/cna/resources" className="text-xs px-4 py-2 border border-coral/40 rounded-full hover:bg-coral hover:text-cream transition">
              Find a CPR class
            </Link>
            <button className="text-xs px-4 py-2 bg-coral text-cream rounded-full hover:bg-inkdark transition">
              Upload new cert
            </button>
          </div>
        </div>
      </section>

      {/* CORE CREDENTIALS */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.15s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
          Required to maintain Verified tier
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">Core credentials</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* CNA License — REAL */}
          <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center text-2xl flex-shrink-0">🏅</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="font-display text-lg font-medium">CNA License</div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-mono ${licenseVerified ? 'doc-status-ok' : 'doc-status-miss'}`}>
                    {licenseVerified ? '✓ Current' : '○ Pending'}
                  </span>
                </div>
                <div className="text-xs text-ink/60 mb-3 font-mono">
                  {profile?.license_number ? `FL #${profile.license_number} · Verified via FL DOH` : 'Not added'}
                </div>
                <div className="text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between"><span className="text-ink/60">Verified</span><span className="font-mono">{fmtDate(profile?.license_verified_at)}</span></div>
                  <div className="flex justify-between"><span className="text-ink/60">Expires</span><span className="font-mono">{fmtDate(profile?.license_expires_at)}</span></div>
                </div>
                <button className="text-xs text-deepteal hover:text-coral">View certificate →</button>
              </div>
            </div>
          </div>

          {/* Background check — REAL */}
          <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center text-2xl flex-shrink-0">🛡️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="font-display text-lg font-medium">Level 2 Background Check</div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-mono ${bgClear ? 'doc-status-ok' : 'doc-status-miss'}`}>
                    {bgClear ? '✓ Cleared' : '○ Pending'}
                  </span>
                </div>
                <div className="text-xs text-ink/60 mb-3 font-mono">Run by Checkr · FL AHCA Clearinghouse</div>
                <div className="text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between"><span className="text-ink/60">Cleared</span><span className="font-mono">{fmtDate(profile?.bg_check_completed_at)}</span></div>
                  <div className="flex justify-between"><span className="text-ink/60">Fingerprint</span><span className="font-mono">Live Scan ✓</span></div>
                </div>
                <button className="text-xs text-deepteal hover:text-coral">View clearance →</button>
              </div>
            </div>
          </div>

          {/* CPR — FILLER */}
          <div className="card-hover bg-coral/5 border border-coral/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-coral/20 flex items-center justify-center text-2xl flex-shrink-0">❤️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="font-display text-lg font-medium">CPR / First Aid</div>
                  <span className="text-[10px] px-2 py-1 rounded-full border doc-status-crit font-mono">⚠ 30 days</span>
                </div>
                <div className="text-xs text-ink/60 mb-3 font-mono">American Red Cross · Adult CPR/AED</div>
                <div className="text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between"><span className="text-ink/60">Issued</span><span className="font-mono">Jun 14, 2024</span></div>
                  <div className="flex justify-between"><span className="text-ink/60">Expires</span><span className="font-mono text-coral">Jun 14, 2026 ⚠</span></div>
                </div>
                <button className="text-xs px-3 py-1.5 bg-coral text-cream rounded-full hover:bg-inkdark transition">
                  Upload renewed cert
                </button>
              </div>
            </div>
          </div>

          {/* ID — FILLER */}
          <div className="card-hover bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center text-2xl flex-shrink-0">🆔</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="font-display text-lg font-medium">Identity verified</div>
                  <span className="text-[10px] px-2 py-1 rounded-full border doc-status-ok font-mono">✓ Verified</span>
                </div>
                <div className="text-xs text-ink/60 mb-3 font-mono">Stripe Identity · FL Driver&rsquo;s License</div>
                <div className="text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between"><span className="text-ink/60">Verified</span><span className="font-mono">Mar 5, 2026</span></div>
                  <div className="flex justify-between"><span className="text-ink/60">Method</span><span className="font-mono">Selfie + photo ID</span></div>
                </div>
                <div className="text-xs text-ink/50">No action needed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMMUNIZATIONS — FILLER */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.2s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
          Required to work at facilities (B2B)
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">Health &amp; immunizations</h2>

        <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
            <div className="col-span-5">Document</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {[
            { name: 'TB Test (PPD)', sub: 'Annual screening', date: 'Feb 22, 2026 · Negative', status: '✓ Current', statusCls: 'doc-status-ok', action: 'View' },
            { name: 'Hepatitis B', sub: 'Vaccination series', date: 'Series complete 2019', status: '✓ Complete', statusCls: 'doc-status-ok', action: 'View' },
            { name: 'Flu shot', sub: '2025–26 season', date: 'Oct 14, 2025', status: 'Expires Sep', statusCls: 'doc-status-warn', action: 'View' },
            { name: 'COVID-19 vaccination', sub: 'Some facilities require updated booster', date: 'Not on file', status: '○ Optional', statusCls: 'doc-status-miss', action: '+ Upload', missing: true },
          ].map((row, i, arr) => (
            <div key={row.name} className={`grid grid-cols-12 gap-4 px-5 py-4 text-sm items-center hover:bg-mist/40 transition ${i < arr.length - 1 ? 'border-b border-ink/10' : ''}`}>
              <div className="col-span-5">
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-ink/60">{row.sub}</div>
              </div>
              <div className={`col-span-3 font-mono text-xs ${row.missing ? 'text-ink/40' : ''}`}>{row.date}</div>
              <div className="col-span-2">
                <span className={`text-[10px] px-2 py-1 rounded-full border font-mono ${row.statusCls}`}>{row.status}</span>
              </div>
              <div className="col-span-2 text-right">
                <button className="text-xs text-deepteal hover:text-coral">{row.action}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REFERENCES — FILLER */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.25s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Help us trust you faster</div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">Professional references</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] bg-sage/20 text-deepteal px-2 py-1 rounded-full font-medium">✓ Verified</span>
            </div>
            <div className="font-display text-lg font-medium">Dr. Rebecca Lane, RN</div>
            <div className="text-xs text-ink/60 mt-1">Former supervisor · Alachua Senior Care</div>
            <div className="text-xs text-ink/60 mt-3 italic">
              &ldquo;Maria is the kind of caregiver you wish you had three of.&rdquo;
            </div>
            <div className="text-[10px] text-ink/50 font-mono mt-3">Verified Mar 6, 2026</div>
          </div>

          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] bg-sage/20 text-deepteal px-2 py-1 rounded-full font-medium">✓ Verified</span>
            </div>
            <div className="font-display text-lg font-medium">Patricia M. (former client family)</div>
            <div className="text-xs text-ink/60 mt-1">Cared for her father · 2 years</div>
            <div className="text-xs text-ink/60 mt-3 italic">
              &ldquo;Trustworthy, patient, and a steady presence in our home.&rdquo;
            </div>
            <div className="text-[10px] text-ink/50 font-mono mt-3">Verified Mar 7, 2026</div>
          </div>

          <div className="bg-coral/5 border border-coral/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-2">+</div>
            <div className="font-display text-base font-medium mb-1">Add a third reference</div>
            <div className="text-xs text-ink/60 mb-4">Helps you unlock Top-Rated tier faster</div>
            <button className="text-xs px-4 py-2 bg-deepteal text-cream rounded-full hover:bg-inkdark transition">
              Send invite
            </button>
          </div>
        </div>
      </section>

      {/* OPTIONAL CERTS — FILLER */}
      <section className="fade-up" style={{ animationDelay: '.3s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">
          Extra credentials = more job invites
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-medium mb-6">Optional certifications</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '🧠', title: 'Dementia care certification', cost: '~$199 · 12-hr online course', desc: 'Unlocks dementia-tagged jobs that pay 15–25% more.' },
            { icon: '🤲', title: 'Hospice / end-of-life', cost: '~$249 · 16-hr course', desc: 'Premium pay. Emotionally demanding but deeply meaningful work.' },
            { icon: '💉', title: 'Medication aide (FL)', cost: '~$499 · 40-hr course + exam', desc: 'Lets you administer (not just remind) meds. Bumps rate to $30+/hr.' },
          ].map((c) => (
            <div key={c.title} className="card-hover bg-creamdark/60 border border-ink/10 rounded-2xl p-5">
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="font-display text-lg font-medium">{c.title}</div>
              <div className="text-xs text-ink/60 mt-1 mb-4">{c.cost}</div>
              <p className="text-xs text-ink/70 leading-relaxed mb-4">{c.desc}</p>
              <Link href="/cna/resources" className="text-xs text-deepteal hover:text-coral">Find a course →</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
