/**
 * /cna/compliance — "Credentials": the caregiver's Kindred Standard documents.
 *
 * Order (Nick, Nov 9): proof of hours comes with the application; the Level 2
 * background check, photo ID and liability insurance open only after Kindred
 * accepts the caregiver (application_status 'verifying' or 'approved'), so
 * nobody pays for a background check or a policy and then gets declined.
 * Files go to private storage (owner-only); only an admin marks them verified.
 *
 * Shell (nav/footer) comes from app/cna/layout.tsx.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StandardDocUpload } from '@/components/cna/StandardDocUpload';

export const dynamic = 'force-dynamic';

type Status = 'none' | 'pending' | 'verified' | 'rejected' | 'expired';

const CREDENTIAL_LABEL: Record<string, string> = {
  cna: 'CNA',
  hha: 'Home Health Aide',
  lpn: 'LPN',
  rn: 'RN',
  other: 'Other caregiving experience',
};

export default async function CnaCompliancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/cna/compliance');

  const [{ data: profile }, { data: verifs }, { data: hoursDocs }] = await Promise.all([
    supabase
      .from('cna_profiles')
      .select('credential, license_number, experience_hours, experience_hours_reported, application_status')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('cna_verifications')
      .select('type, status, expires_at, created_at')
      .eq('cna_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('documents')
      .select('id, original_filename, uploaded_at')
      .eq('user_id', user.id)
      .eq('type', 'work_history')
      .order('uploaded_at', { ascending: false }),
  ]);
  const accepted = profile?.application_status === 'verifying' || profile?.application_status === 'approved';

  const today = new Date().toISOString().slice(0, 10);
  const stateOf = (type: string): { status: Status; expiresAt: string | null } => {
    const v = (verifs ?? []).find((r) => r.type === type);
    if (!v) return { status: 'none', expiresAt: null };
    if (v.status === 'verified' && v.expires_at && v.expires_at < today) return { status: 'expired', expiresAt: v.expires_at };
    return { status: (v.status as Status) ?? 'pending', expiresAt: v.expires_at };
  };

  const docs = [
    {
      type: 'l2bg' as const,
      title: 'Level 2 background check',
      help: 'Your Florida Level 2 (fingerprint) screening results or clearance letter.',
      icon: '🛡️',
      askExpiry: true,
      expiryRequired: false,
    },
    {
      type: 'identity' as const,
      title: 'Photo ID',
      help: 'A clear photo of your driver’s license, state ID or passport. Only Kindred staff see this.',
      icon: '🪪',
      askExpiry: false,
      expiryRequired: false,
    },
    {
      type: 'insurance' as const,
      title: 'Liability insurance',
      help: 'Your current policy’s declarations page or certificate of insurance, showing your name and the dates.',
      icon: '📄',
      askExpiry: true,
      expiryRequired: true,
    },
  ];

  const reported = profile?.experience_hours_reported ?? null;
  const confirmed = profile?.experience_hours ?? null;

  return (
    <main className="max-w-kindred mx-auto px-4 sm:px-6 py-10 lg:py-14">
      <section className="mb-10 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Credentials</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Your <span className="italic font-medium text-gradient">documents</span>, in one place.
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            {accepted
              ? 'You’re in. Families can find you once your background check, ID and insurance are verified.'
              : 'Right now we only need proof of your hours. Your background check, ID and insurance come after we accept you.'}{' '}
            Everything you upload is private: only you and Kindred staff can see it.
          </p>
        </div>
        <Link
          href="/cna/membership"
          className="bg-white border border-ink/15 px-5 py-2.5 text-sm rounded-full hover:bg-mist transition"
        >
          See your full progress
        </Link>
      </section>

      <section className="mb-10 fade-up" style={{ animationDelay: '.03s' }}>
        <h2 className="font-display text-2xl font-medium mb-1">Your hours</h2>
        <p className="text-sm text-ink/60 mb-4">The Kindred Standard asks for 1,500+ hours of hands-on care.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <StandardDocUpload
            type="hours"
            title="Proof of hours"
            help="Employer or agency letters, pay stubs, timesheets or a work history printout. Add as many as you need."
            icon="⏱️"
            status={confirmed != null ? 'verified' : (hoursDocs ?? []).length ? 'pending' : 'none'}
            badgeOverride={
              confirmed != null
                ? { label: '✓ Hours confirmed', cls: 'bg-sage/30 text-deepteal' }
                : (hoursDocs ?? []).length
                  ? { label: `${(hoursDocs ?? []).length} on file`, cls: 'bg-butter text-deepteal' }
                  : undefined
            }
            footnote={
              (hoursDocs ?? []).length ? (
                <ul className="space-y-0.5">
                  {(hoursDocs ?? []).slice(0, 4).map((d) => (
                    <li key={d.id} className="truncate">📎 {d.original_filename ?? 'Document'}</li>
                  ))}
                </ul>
              ) : null
            }
            expiresAt={null}
            askExpiry={false}
          />
          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Hours you reported</div>
            <div className="font-display text-3xl font-medium">{reported != null ? reported.toLocaleString('en-US') : '—'}</div>
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl p-5">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Hours confirmed by Kindred</div>
            <div className="font-display text-3xl font-medium">{confirmed != null ? confirmed.toLocaleString('en-US') : '—'}</div>
            <div className="text-xs text-ink/55 mt-1">{confirmed != null ? 'Checked against your proof.' : 'We confirm this around your interview.'}</div>
          </div>
        </div>
      </section>

      <section className="mb-10 fade-up" style={{ animationDelay: '.05s' }}>
        <h2 className="font-display text-2xl font-medium mb-1">{accepted ? 'Your onboarding documents' : 'After you’re accepted'}</h2>
        <p className="text-sm text-ink/60 mb-4">
          {accepted
            ? 'Upload each one here. We review them and tell you if anything needs a new copy.'
            : 'These three open once Kindred accepts you, so you never spend money on them before you know you’re in.'}
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {docs.map((d) => {
            const st = stateOf(d.type);
            return (
              <StandardDocUpload
                key={d.type}
                type={d.type}
                title={d.title}
                help={d.help}
                icon={d.icon}
                status={st.status}
                expiresAt={st.expiresAt}
                askExpiry={d.askExpiry}
                expiryRequired={d.expiryRequired}
                locked={!accepted}
              />
            );
          })}
        </div>
        <p className="text-xs text-ink/50 mt-3">
          PDF or photo, up to 10 MB. Need liability insurance? Most caregivers find a policy in a day; see{' '}
          <Link href="/cna/get-insured" className="text-deepteal hover:text-coral">getting insured</Link>.
        </p>
      </section>

      <section className="fade-up" style={{ animationDelay: '.1s' }}>
        <div className="bg-white border border-ink/10 rounded-2xl p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Credential</div>
          <div className="font-medium">{profile?.credential ? CREDENTIAL_LABEL[profile.credential] ?? profile.credential : 'Not added'}</div>
          {profile?.license_number && <div className="text-xs text-ink/60 font-mono mt-0.5">#{profile.license_number}</div>}
        </div>
      </section>
    </main>
  );
}
