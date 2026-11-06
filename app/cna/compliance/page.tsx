/**
 * /cna/compliance — "Credentials": the caregiver's Kindred Standard documents.
 *
 * Caregivers upload proof of their Level 2 background check, photo ID and
 * liability insurance here (private storage, owner-only). Each upload goes to
 * Kindred for review; only an admin can mark it verified. Experience hours are
 * shown as reported vs confirmed. Overall progress + membership live on
 * /cna/membership.
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

  const [{ data: profile }, { data: verifs }] = await Promise.all([
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
  ]);

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
            Families can find you once these three are verified, along with your interview and hours.
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

      <section className="mb-10 fade-up" style={{ animationDelay: '.05s' }}>
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
        <div className="bg-white border border-ink/10 rounded-2xl p-6 grid sm:grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Credential</div>
            <div className="font-medium">{profile?.credential ? CREDENTIAL_LABEL[profile.credential] ?? profile.credential : 'Not added'}</div>
            {profile?.license_number && <div className="text-xs text-ink/60 font-mono mt-0.5">#{profile.license_number}</div>}
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Hours you reported</div>
            <div className="font-medium">{reported != null ? reported.toLocaleString('en-US') : 'Not added'}</div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Hours confirmed</div>
            <div className="font-medium">
              {confirmed != null ? confirmed.toLocaleString('en-US') : 'After your interview'}
            </div>
            <div className="text-xs text-ink/55 mt-0.5">The Kindred Standard asks for 1,500+.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
