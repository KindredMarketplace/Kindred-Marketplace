/**
 * /cna/compliance — credentials on file.
 *
 * DATA NOTE: Only real data is shown: the CNA license (number + verified
 * status + dates) and the Level 2 background check status from cna_profiles.
 * ID, liability insurance, and the rest of the Kindred Standard are tracked on
 * /cna/membership, so this page points there instead of showing placeholder
 * rows. Document upload is being built separately.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CnaCompliancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('cna_profiles')
    .select('license_number, license_verified_at, license_expires_at, bg_check_status, bg_check_completed_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const licenseVerified = Boolean(profile?.license_verified_at);
  const bgClear = profile?.bg_check_status === 'clear';

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not yet';

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-10 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Credentials</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Your <span className="italic font-medium text-gradient">credentials</span>, on file.
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            What we have on record for your license and background check. Your full progress
            toward the Kindred Standard lives on your Membership page.
          </p>
        </div>
        <Link
          href="/cna/membership"
          className="bg-deepteal text-cream px-5 py-2.5 text-sm rounded-full hover:bg-inkdark transition"
        >
          See Kindred Standard progress
        </Link>
      </section>

      {/* CORE CREDENTIALS — REAL */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">On file</div>
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
                  {profile?.license_number
                    ? `FL #${profile.license_number}${licenseVerified ? ' · Verified with FL DOH' : ''}`
                    : 'Not added yet'}
                </div>
                <div className="text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between"><span className="text-ink/60">Verified</span><span className="font-mono">{fmtDate(profile?.license_verified_at)}</span></div>
                  <div className="flex justify-between"><span className="text-ink/60">Expires</span><span className="font-mono">{fmtDate(profile?.license_expires_at)}</span></div>
                </div>
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
                <div className="text-xs text-ink/60 mb-3 font-mono">Florida Level 2 (fingerprint-based)</div>
                <div className="text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between"><span className="text-ink/60">Cleared</span><span className="font-mono">{fmtDate(profile?.bg_check_completed_at)}</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* KINDRED STANDARD — points to the real progress view */}
      <section className="fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">⭐</div>
          <h2 className="font-display text-xl font-medium mb-1">ID, insurance, and the rest of the Kindred Standard</h2>
          <p className="text-sm text-ink/60 max-w-lg mx-auto mb-5">
            The Kindred Standard is a personal interview, 1,500+ hours of hands-on experience, a
            Level 2 background check, a verified ID, and your own liability insurance. You can see
            which parts are done, and what&rsquo;s still open, on your Membership page.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/cna/membership"
              className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition"
            >
              Go to Membership
            </Link>
            <Link
              href="/kindred-standard"
              className="inline-block border border-ink/15 px-5 py-2.5 rounded-full text-sm hover:bg-mist transition"
            >
              Read the Kindred Standard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
