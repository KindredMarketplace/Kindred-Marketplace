/**
 * /admin/applications — the CNA application review queue.
 *
 * A board grouped by the three active human-review stages
 * (submitted -> interviewing -> verifying), plus a compact roll-up of
 * approved and declined applicants underneath.
 *
 * Server component. Reads real data; honest empty states when a column is
 * empty. Access gated by middleware (/admin/* = admins only) and re-checked
 * here. The demo applicants on @kindred.demo emails populate this so the
 * mechanism is walkable before the public apply flow exists.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  PIPELINE_STAGES,
  STAGE_LABEL,
  STAGE_BLURB,
  STAGE_DOT,
  relTime,
  type AppStage,
} from './stages';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  last_name: string | null;
  headline: string | null;
  license_number: string | null;
  years_experience: number | null;
  hourly_rate_cents: number | null;
  service_zip: string | null;
  application_status: AppStage | null;
  application_submitted_at: string | null;
  interview_at: string | null;
};

export default async function ApplicationsQueuePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin' || me?.status !== 'active') {
    redirect('/login?error=not_authorized');
  }

  // New columns came from migration 00019; cast until types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawProfiles } = await (supabase.from('cna_profiles') as any)
    .select(
      'user_id, display_name, last_name, headline, license_number, years_experience, hourly_rate_cents, service_zip, application_status, application_submitted_at, interview_at',
    )
    .order('application_submitted_at', { ascending: true });

  const profiles = (rawProfiles ?? []) as ProfileRow[];

  const byStage = (stage: AppStage) =>
    profiles.filter((p) => p.application_status === stage);

  const approved = byStage('approved');
  const declined = profiles.filter(
    (p) => p.application_status === 'rejected' || p.application_status === 'waitlisted',
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-display text-xl">
              Kindred <span className="text-stone-400">/ Applications</span>
            </Link>
            <span className="rounded-full bg-coral/30 px-3 py-0.5 text-xs font-medium text-coral">
              Staff only
            </span>
          </div>
          <Link href="/admin" className="text-sm text-stone-300 hover:text-white">
            ← Back to admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-stone-900 mb-2">CNA applications</h1>
          <p className="text-stone-600 max-w-3xl">
            Application first, then a real conversation, then the expensive verification —
            only for people you&apos;ve decided you want. Move people right as they earn it;
            decline at any gate.
          </p>
        </div>

        {/* The board */}
        <div className="grid lg:grid-cols-3 gap-5">
          {PIPELINE_STAGES.map((stage) => {
            const rows = byStage(stage);
            return (
              <section
                key={stage}
                className="rounded-2xl border border-stone-200 bg-white overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${STAGE_DOT[stage]}`} />
                    <h2 className="font-display text-lg text-stone-900">{STAGE_LABEL[stage]}</h2>
                    <span className="ml-auto text-sm font-medium text-stone-400">
                      {rows.length}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {STAGE_BLURB[stage]}
                  </p>
                </div>

                <div className="p-3 space-y-3 min-h-[120px]">
                  {rows.length === 0 ? (
                    <p className="text-sm text-stone-400 italic px-2 py-6 text-center">
                      Nobody here right now.
                    </p>
                  ) : (
                    rows.map((p) => <ApplicantCard key={p.user_id} p={p} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Roll-ups */}
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <RollUp
            title="Approved · live in Browse"
            dot={STAGE_DOT.approved}
            rows={approved}
            emptyLabel="No approved caregivers yet."
          />
          <RollUp
            title="Declined / waitlisted"
            dot={STAGE_DOT.rejected}
            rows={declined}
            emptyLabel="No declines yet."
          />
        </div>
      </main>
    </div>
  );
}

function ApplicantCard({ p }: { p: ProfileRow }) {
  const name = [p.display_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed applicant';
  return (
    <Link
      href={`/admin/applications/${p.user_id}`}
      className="block rounded-xl border border-stone-200 p-4 hover:border-teal hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-base text-stone-900">{name}</div>
        <span className="text-[11px] text-stone-400 whitespace-nowrap">
          applied {relTime(p.application_submitted_at)}
        </span>
      </div>
      {p.headline && (
        <p className="text-xs text-stone-600 mt-1 line-clamp-2">{p.headline}</p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-stone-500">
        {p.years_experience != null && <span>{p.years_experience} yrs exp</span>}
        {p.license_number && <span className="font-mono">{p.license_number}</span>}
        {p.service_zip && <span>{p.service_zip}</span>}
      </div>
      {p.application_status === 'interviewing' && (
        <div className="mt-3 text-[11px] font-medium text-stone-700 bg-butter/30 rounded-md px-2 py-1 inline-block">
          {p.interview_at ? `Interview ${relTime(p.interview_at)}` : 'Interview not scheduled'}
        </div>
      )}
    </Link>
  );
}

function RollUp({
  title,
  dot,
  rows,
  emptyLabel,
}: {
  title: string;
  dot: string;
  rows: ProfileRow[];
  emptyLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
        <h2 className="font-medium text-stone-800 text-sm">{title}</h2>
        <span className="ml-auto text-sm font-medium text-stone-400">{rows.length}</span>
      </div>
      <div className="divide-y divide-stone-100">
        {rows.length === 0 ? (
          <p className="text-sm text-stone-400 italic px-5 py-5">{emptyLabel}</p>
        ) : (
          rows.map((p) => {
            const name =
              [p.display_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed';
            return (
              <Link
                key={p.user_id}
                href={`/admin/applications/${p.user_id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-stone-50"
              >
                <span className="text-sm text-stone-800">{name}</span>
                <span className="text-xs text-stone-400">
                  {STAGE_LABEL[p.application_status ?? 'submitted']}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
