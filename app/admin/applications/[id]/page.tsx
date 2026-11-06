/**
 * /admin/applications/[id] — review one CNA applicant and move them through
 * the pipeline.
 *
 * Shows: their screening answers (the customer-discovery-style Q&A), profile
 * facts, uploaded documents (honest empty state until the apply flow collects
 * them), private admin notes, and stage-appropriate action controls.
 *
 * Server component. All actions post to updateApplicationAction.
 */

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { updateApplicationAction } from '../actions';
import { setVerificationAction, setExperienceHoursAction, compMembershipAction } from '../standard-actions';
import { STAGE_LABEL, STAGE_DOT, STAGE_BLURB, relTime, type AppStage } from '../stages';

export const dynamic = 'force-dynamic';

const BUCKET = 'kindred-documents';
const PROMPT =
  'Tell us about a client who stuck with you — something they said or did, good or hard, that you still carry.';

type Answer = { q: string; a: string };

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Columns from migration 00019 — cast until types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: p } = await (supabase.from('cna_profiles') as any)
    .select('*')
    .eq('user_id', id)
    .single();

  if (!p) notFound();

  const { data: u } = await supabase
    .from('users')
    .select('full_name, email, phone, status, created_at')
    .eq('id', id)
    .single();

  const [{ data: verifs }, { data: membership }] = await Promise.all([
    supabase.from('cna_verifications').select('type, status, expires_at, document_id').eq('cna_id', id),
    supabase
      .from('memberships')
      .select('status, founding, current_period_end, comp_reason, stripe_subscription_id')
      .eq('user_id', id)
      .maybeSingle(),
  ]);

  // Signed, 10-minute links to the caregiver's uploaded Kindred Standard proof.
  // The bucket is private; only this admin-checked page mints links.
  const docLinks: Record<string, string> = {};
  const verifDocIds = (verifs ?? []).map((v) => v.document_id).filter((x): x is string => !!x);
  if (verifDocIds.length > 0) {
    const svc = createServiceClient();
    const { data: vdocs } = await svc.from('documents').select('id, storage_path').in('id', verifDocIds);
    for (const v of verifs ?? []) {
      const d = (vdocs ?? []).find((x) => x.id === v.document_id);
      if (!d?.storage_path) continue;
      const { data: signed } = await svc.storage.from('kindred-documents').createSignedUrl(d.storage_path, 600);
      if (signed?.signedUrl) docLinks[v.type] = signed.signedUrl;
    }
  }

  const { data: docs } = await supabase
    .from('documents')
    .select('id, type, original_filename, uploaded_at')
    .eq('user_id', id);

  // The application's own files live in a private bucket; mint short-lived
  // signed URLs with the service client (admins aren't the file owner under
  // storage RLS, so the service client is the way to read them).
  let resumeUrl: string | null = null;
  let mediaUrl: string | null = null;
  if (p.resume_path || p.application_media_path) {
    const svc = createServiceClient();
    if (p.resume_path) {
      const { data: s } = await svc.storage.from(BUCKET).createSignedUrl(p.resume_path, 3600);
      resumeUrl = s?.signedUrl ?? null;
    }
    if (p.application_media_path) {
      const { data: s } = await svc.storage
        .from(BUCKET)
        .createSignedUrl(p.application_media_path, 3600);
      mediaUrl = s?.signedUrl ?? null;
    }
  }

  const stage = (p.application_status ?? 'submitted') as AppStage;
  const name =
    [p.display_name, p.last_name].filter(Boolean).join(' ') || u?.full_name || 'Applicant';
  const answers: Answer[] = Array.isArray(p.application_answers) ? p.application_answers : [];

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin/applications" className="text-sm text-stone-300 hover:text-white">
            ← All applications
          </Link>
          <span className="rounded-full bg-coral/30 px-3 py-0.5 text-xs font-medium text-coral">
            Staff only
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-stone-900">{name}</h1>
            <p className="text-stone-500 text-sm mt-1">
              Applied {relTime(p.application_submitted_at)} · {u?.email}
              {u?.phone ? ` · ${u.phone}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${STAGE_DOT[stage]}`} />
            <span className="text-sm font-medium text-stone-800">{STAGE_LABEL[stage]}</span>
          </div>
        </div>
        <p className="text-sm text-stone-500 mb-8">{STAGE_BLURB[stage]}</p>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* LEFT: the application */}
          <div className="space-y-6">
            {/* The one answer: video/audio + resume */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-xl text-stone-900 mb-1">Their answer</h2>
              <p className="text-sm text-stone-500 mb-4 italic">&ldquo;{PROMPT}&rdquo;</p>

              {mediaUrl ? (
                p.application_media_kind === 'audio' ? (
                  <audio controls src={mediaUrl} className="w-full" />
                ) : (
                  <video
                    controls
                    src={mediaUrl}
                    className="w-full rounded-lg bg-black max-h-[420px]"
                  />
                )
              ) : (
                <p className="text-sm text-stone-400 italic">No recording on file.</p>
              )}

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm text-stone-600">Resume</span>
                {resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-deepteal hover:underline"
                  >
                    Open resume &rarr;
                  </a>
                ) : (
                  <span className="text-sm text-stone-400 italic">None uploaded</span>
                )}
              </div>

              {answers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100 space-y-4">
                  {answers.map((qa, i) => (
                    <div key={i}>
                      <div className="text-sm font-medium text-stone-700 mb-1">{qa.q}</div>
                      <p className="text-sm text-stone-600 leading-relaxed">{qa.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Profile facts */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-xl text-stone-900 mb-4">Profile</h2>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Fact label="Headline" value={p.headline} />
                <Fact
                  label="Experience"
                  value={p.years_experience != null ? `${p.years_experience} years` : null}
                />
                <Fact label="FL CNA license #" value={p.license_number} mono />
                <Fact
                  label="Proposed rate"
                  value={p.hourly_rate_cents != null ? `$${(p.hourly_rate_cents / 100).toFixed(0)}/hr` : null}
                />
                <Fact label="Service ZIP" value={p.service_zip} />
                <Fact
                  label="Languages"
                  value={Array.isArray(p.languages) ? p.languages.join(', ') : null}
                />
              </dl>
              {p.bio && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="text-xs uppercase tracking-wider text-stone-400 mb-1">Bio</div>
                  <p className="text-sm text-stone-600 leading-relaxed">{p.bio}</p>
                </div>
              )}
            </section>

            {/* Documents */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="font-display text-xl text-stone-900 mb-1">Documents</h2>
              <p className="text-xs text-stone-500 mb-4">
                Collected during verification — license, government ID, CPR/BLS, TB clearance,
                L2 background check, two references.
              </p>
              {!docs || docs.length === 0 ? (
                <p className="text-sm text-stone-400 italic">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-stone-700 capitalize">
                        {String(d.type).replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-stone-400">
                        {d.original_filename ?? 'uploaded'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* RIGHT: the controls */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <StageControls id={id} stage={stage} interviewAt={p.interview_at} />

            <StandardPanel
              id={id}
              approved={stage === 'approved'}
              hours={p.experience_hours ?? null}
              reportedHours={p.experience_hours_reported ?? null}
              credential={p.credential ?? null}
              docLinks={docLinks}
              verifs={verifs ?? []}
              membership={membership ?? null}
            />

            {/* Private notes */}
            <section className="rounded-2xl border border-stone-200 bg-white p-5">
              <h3 className="font-medium text-stone-800 text-sm mb-1">Private notes</h3>
              <p className="text-[11px] text-stone-400 mb-3">
                Never shown to families or the CNA.
              </p>
              <form action={updateApplicationAction} className="space-y-3">
                <input type="hidden" name="applicant_id" value={id} />
                <input type="hidden" name="next_status" value={stage} />
                <textarea
                  name="notes"
                  rows={5}
                  defaultValue={p.application_notes ?? ''}
                  placeholder="Interview impressions, references, red/green flags…"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-teal"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Save notes
                </button>
              </form>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className={`text-stone-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

/**
 * Stage-appropriate buttons. Each is a tiny form posting to the one update
 * action with a different target. Decline carries a reason; interview carries
 * a date.
 */
function StageControls({
  id,
  stage,
  interviewAt,
}: {
  id: string;
  stage: AppStage;
  interviewAt: string | null;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <h3 className="font-display text-lg text-stone-900">Move this applicant</h3>

      {stage === 'submitted' && (
        <Advance id={id} to="interviewing" label="Invite to interview →" primary />
      )}

      {stage === 'interviewing' && (
        <>
          <form action={updateApplicationAction} className="space-y-2">
            <input type="hidden" name="applicant_id" value={id} />
            <input type="hidden" name="next_status" value="interviewing" />
            <label className="block text-xs font-medium text-stone-600">Interview time</label>
            <input
              type="datetime-local"
              name="interview_at"
              defaultValue={toLocalInput(interviewAt)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Save interview time
            </button>
          </form>
          <Advance id={id} to="verifying" label="Passed — start verification →" primary />
        </>
      )}

      {stage === 'verifying' && (
        <>
          <p className="text-xs text-stone-500 leading-relaxed">
            Confirm license, L2 background, ID, CPR/BLS, TB, and two references before approving.
          </p>
          <Advance id={id} to="approved" label="Approve & publish to Browse" primary approve />
          <Advance id={id} to="waitlisted" label="Waitlist" />
        </>
      )}

      {stage === 'approved' && (
        <>
          <p className="text-sm text-deepteal bg-sage/15 rounded-lg px-3 py-2">
            ✓ Live in Browse. Families can find them.
          </p>
          <Advance id={id} to="verifying" label="Pull back to verification" />
        </>
      )}

      {(stage === 'rejected' || stage === 'waitlisted') && (
        <Advance id={id} to="submitted" label="Reopen application" />
      )}

      {/* Decline is available from any active stage. */}
      {(stage === 'submitted' || stage === 'interviewing' || stage === 'verifying') && (
        <details className="pt-2 border-t border-stone-100">
          <summary className="text-sm text-coral cursor-pointer hover:underline">
            Decline this applicant
          </summary>
          <form action={updateApplicationAction} className="space-y-2 mt-3">
            <input type="hidden" name="applicant_id" value={id} />
            <input type="hidden" name="next_status" value="rejected" />
            <textarea
              name="reason"
              rows={3}
              required
              placeholder="Reason (internal — basis for honest feedback)"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-coral"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-coral/90 px-3 py-2 text-sm font-medium text-white hover:bg-coral"
            >
              Decline
            </button>
          </form>
        </details>
      )}
    </section>
  );
}

function Advance({
  id,
  to,
  label,
  primary,
  approve,
}: {
  id: string;
  to: AppStage;
  label: string;
  primary?: boolean;
  approve?: boolean;
}) {
  const cls = approve
    ? 'bg-teal text-white hover:bg-teal/90'
    : primary
      ? 'bg-stone-900 text-white hover:bg-stone-800'
      : 'border border-stone-300 text-stone-700 hover:bg-stone-50';
  return (
    <form action={updateApplicationAction}>
      <input type="hidden" name="applicant_id" value={id} />
      <input type="hidden" name="next_status" value={to} />
      <button type="submit" className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium ${cls}`}>
        {label}
      </button>
    </form>
  );
}

/** ISO -> value usable by <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


/* ---------------------------------------------------------------------------
 * Kindred Standard + membership panel
 * ------------------------------------------------------------------------- */

const STANDARD_DOCS: { type: 'l2bg' | 'identity' | 'insurance'; label: string; needsExpiry: boolean }[] = [
  { type: 'l2bg', label: 'Level 2 background', needsExpiry: true },
  { type: 'identity', label: 'ID verified', needsExpiry: false },
  { type: 'insurance', label: 'Liability insurance', needsExpiry: true },
];

function StandardPanel({
  id,
  approved,
  hours,
  reportedHours,
  credential,
  docLinks,
  verifs,
  membership,
}: {
  id: string;
  approved: boolean;
  hours: number | null;
  reportedHours: number | null;
  credential: string | null;
  docLinks: Record<string, string>;
  verifs: { type: string; status: string; expires_at: string | null }[];
  membership: {
    status: string;
    founding: boolean;
    current_period_end: string | null;
    comp_reason: string | null;
    stripe_subscription_id: string | null;
  } | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const docOk = (t: string) =>
    verifs.some((v) => v.type === t && v.status === 'verified' && (!v.expires_at || v.expires_at >= today));
  const hoursOk = (hours ?? 0) >= 1500;
  const memberOk =
    !!membership &&
    (membership.status === 'active' || membership.status === 'comped') &&
    (!membership.current_period_end || membership.current_period_end > new Date().toISOString());
  const listed = approved && hoursOk && STANDARD_DOCS.every((d) => docOk(d.type)) && memberOk;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-stone-800 text-sm">Kindred Standard</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${listed ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}
        >
          {listed ? 'Listed: families can see them' : 'Not listed'}
        </span>
      </div>

      <ul className="text-xs text-stone-600 space-y-1">
        <li>{approved ? '✅' : '⬜'} Interview passed (stage = Approved)</li>
        <li>{hoursOk ? '✅' : '⬜'} 1,500+ hours ({hours ?? 'not recorded'})</li>
        {STANDARD_DOCS.map((d) => (
          <li key={d.type}>
            {docOk(d.type) ? '✅' : '⬜'} {d.label}
          </li>
        ))}
        <li>
          {memberOk ? '✅' : '⬜'} Membership{' '}
          {membership
            ? `(${membership.founding ? 'founding, ' : ''}${membership.status}${membership.current_period_end ? ` until ${membership.current_period_end.slice(0, 10)}` : ''})`
            : '(none)'}
        </li>
      </ul>

      <form action={setExperienceHoursAction} className="flex gap-2 items-end">
        <input type="hidden" name="applicant_id" value={id} />
        <label className="flex-1 text-[11px] text-stone-500">
          Confirmed hands-on hours
          {reportedHours != null && (
            <span className="ml-1 text-stone-400">
              (they reported {reportedHours.toLocaleString('en-US')}
              {credential ? `, ${credential.toUpperCase()}` : ''})
            </span>
          )}
          <input
            name="experience_hours"
            type="number"
            min={0}
            step={1}
            defaultValue={hours ?? reportedHours ?? ''}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          />
        </label>
        <button className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-50">Save</button>
      </form>

      {STANDARD_DOCS.map((d) => {
        const current = verifs.find((v) => v.type === d.type);
        return (
          <form key={d.type} action={setVerificationAction} className="border-t border-stone-100 pt-3 space-y-2">
            <input type="hidden" name="applicant_id" value={id} />
            <input type="hidden" name="type" value={d.type} />
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">{d.label}</span>
              <span className="text-stone-400">{current ? `${current.status}${current.expires_at ? ` · exp ${current.expires_at}` : ''}` : 'nothing yet'}</span>
            </div>
            {docLinks[d.type] ? (
              <a
                href={docLinks[d.type]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-emerald-800 underline underline-offset-2"
              >
                Open their upload ↗
              </a>
            ) : (
              <div className="text-[11px] text-stone-400">No upload from them yet</div>
            )}
            <div className="flex gap-2">
              {d.needsExpiry && (
                <input
                  name="expires_at"
                  type="date"
                  defaultValue={current?.expires_at ?? ''}
                  aria-label={`${d.label} expires`}
                  className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-xs"
                />
              )}
              <button name="status" value="verified" className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800">
                Verify
              </button>
              <button name="status" value="rejected" className="rounded-lg border border-stone-300 px-3 py-1 text-xs hover:bg-stone-50">
                Reject
              </button>
            </div>
          </form>
        );
      })}

      {!membership?.stripe_subscription_id && (
        <form action={compMembershipAction} className="border-t border-stone-100 pt-3 space-y-2">
          <input type="hidden" name="user_id" value={id} />
          <div className="text-xs font-medium text-stone-700">Comp a membership</div>
          <div className="flex gap-2">
            <select name="months" defaultValue="12" className="rounded-lg border border-stone-200 px-2 py-1 text-xs">
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
            <input
              name="reason"
              required
              placeholder="Reason (e.g. pilot)"
              className="flex-1 rounded-lg border border-stone-200 px-2 py-1 text-xs"
            />
            <button className="rounded-lg border border-stone-300 px-3 py-1 text-xs hover:bg-stone-50">Comp</button>
          </div>
          <p className="text-[11px] text-stone-400">
            Approval auto-grants a founding year while founding spots remain.
          </p>
        </form>
      )}
    </section>
  );
}
