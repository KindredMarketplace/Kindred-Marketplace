/**
 * /admin/people/[id] — one account, everything an admin can do with it:
 * edit details, set a password, suspend / restore, comp or end membership,
 * view as them (read-only), and delete permanently (test accounts).
 */

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader, Flash, StatusPill } from '../../AdminHeader';
import { STAGE_LABEL, type AppStage } from '../../applications/stages';
import { startImpersonationAction } from '../../actions';
import {
  updateAccountAction,
  setAccountStatusAction,
  setPasswordAction,
  setMembershipAction,
  deleteAccountAction,
} from '../actions';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLE_LABEL: Record<string, string> = { client: 'Family', cna: 'Caregiver', admin: 'Admin', business: 'Facility (old)' };

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, status, email').eq('id', user.id).single();
  if (me?.role !== 'admin' || me.status !== 'active') redirect('/login?error=not_authorized');

  const { data: p } = await supabase
    .from('users')
    .select('id, email, full_name, phone, role, status, created_at, last_active_at')
    .eq('id', id)
    .maybeSingle();
  if (!p) notFound();

  const isSelf = p.id === user.id;
  const manageable = p.role === 'client' || p.role === 'cna';

  const [{ data: membership }, { data: cna }, { data: client }, threads, jobs, docs, recipients, { data: access }, { data: history }] =
    await Promise.all([
      supabase.from('memberships').select('status, founding, startup_fee_waived, startup_fee_paid_at, current_period_end, comp_reason, stripe_subscription_id').eq('user_id', id).maybeSingle(),
      p.role === 'cna'
        ? supabase.from('cna_profiles').select('application_status, experience_hours, experience_hours_reported, credential, service_zip, hourly_rate_cents, headline').eq('user_id', id).maybeSingle()
        : Promise.resolve({ data: null }),
      p.role === 'client'
        ? supabase.from('client_profiles').select('name, zip').eq('user_id', id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('message_threads').select('id', { count: 'exact', head: true }).or(`participant_a.eq.${id},participant_b.eq.${id}`),
      p.role === 'client'
        ? supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', id)
        : Promise.resolve({ count: null }),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', id),
      p.role === 'client'
        ? supabase.from('care_recipients').select('id', { count: 'exact', head: true }).eq('client_id', id)
        : Promise.resolve({ count: null }),
      manageable ? supabase.rpc('access_for', { uid: id }) : Promise.resolve({ data: null }),
      supabase
        .from('audit_log')
        .select('id, created_at, context')
        .eq('resource_id', id)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);
  const acc = Array.isArray(access) ? access[0] : null;

  const box = 'rounded-xl border border-stone-200 bg-white p-5';
  const label = 'block text-xs font-medium text-stone-600 mb-1';
  const input = 'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm';
  const btn = 'rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800';
  const btn2 = 'rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50';

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminHeader section="People" email={me?.email} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href={`/admin/people?role=${p.role === 'business' ? 'all' : p.role}`} className="text-sm text-stone-500 hover:text-stone-900">
          ← All {p.role === 'cna' ? 'caregivers' : p.role === 'client' ? 'families' : 'people'}
        </Link>

        <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900">{p.full_name || '(no name)'}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-600">
              <span>{ROLE_LABEL[p.role] ?? p.role}</span>
              <span>·</span>
              <StatusPill status={p.status} />
              <span>·</span>
              <span>Joined {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.role === 'cna' && (
              <Link href={`/admin/applications/${p.id}`} className={btn2}>
                Application &amp; documents →
              </Link>
            )}
            {manageable && (
              <form action={startImpersonationAction}>
                <input type="hidden" name="target_user_id" value={p.id} />
                <input type="hidden" name="reason" value="Viewed from People" />
                <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90">View as them</button>
              </form>
            )}
          </div>
        </div>

        <Flash ok={sp.ok} err={sp.err} />

        <div className="grid md:grid-cols-2 gap-5">
          {/* Snapshot */}
          <section className={box}>
            <h2 className="font-display text-lg mb-3">At a glance</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              {p.role === 'cna' && (
                <>
                  <dt className="text-stone-500">Stage</dt>
                  <dd>{cna?.application_status ? STAGE_LABEL[cna.application_status as AppStage] ?? cna.application_status : '—'}</dd>
                  <dt className="text-stone-500">Listed for families</dt>
                  <dd>{acc?.is_listed ? 'Yes' : 'No'}</dd>
                  <dt className="text-stone-500">Hours (reported / confirmed)</dt>
                  <dd>{cna?.experience_hours_reported?.toLocaleString('en-US') ?? '—'} / {cna?.experience_hours?.toLocaleString('en-US') ?? '—'}</dd>
                  <dt className="text-stone-500">Service ZIP</dt>
                  <dd>{cna?.service_zip ?? '—'}</dd>
                </>
              )}
              {p.role === 'client' && (
                <>
                  <dt className="text-stone-500">Family setup</dt>
                  <dd>{client ? `Done (${client.zip})` : 'Not finished'}</dd>
                  <dt className="text-stone-500">People they care for</dt>
                  <dd>{recipients.count ?? 0}</dd>
                  <dt className="text-stone-500">Jobs posted</dt>
                  <dd>{jobs.count ?? 0}</dd>
                </>
              )}
              <dt className="text-stone-500">Conversations</dt>
              <dd>{threads.count ?? 0}</dd>
              <dt className="text-stone-500">Documents</dt>
              <dd>{docs.count ?? 0}</dd>
              <dt className="text-stone-500">Last active</dt>
              <dd>{p.last_active_at ? new Date(p.last_active_at).toLocaleDateString('en-US') : '—'}</dd>
            </dl>
          </section>

          {/* Membership */}
          {manageable && (
            <section className={box}>
              <h2 className="font-display text-lg mb-3">Membership</h2>
              <p className="text-sm text-stone-700 mb-1">
                Status: <strong>{membership?.status && membership.status !== 'none' ? membership.status : 'None'}</strong>
                {membership?.founding && <span className="ml-2 text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">Founding</span>}
              </p>
              {membership?.comp_reason && <p className="text-xs text-stone-500 mb-1">Comp reason: {membership.comp_reason}</p>}
              {membership?.stripe_subscription_id && <p className="text-xs text-stone-500 mb-1">Paying through Stripe.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {membership?.status !== 'comped' && membership?.status !== 'active' && (
                  <form action={setMembershipAction} className="flex flex-wrap gap-2 w-full">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="mode" value="comp" />
                    <input name="reason" placeholder="Reason (optional)" className={`${input} flex-1 min-w-0`} />
                    <button className={btn}>Comp membership</button>
                  </form>
                )}
                {(membership?.status === 'comped' || membership?.status === 'active') && !membership?.stripe_subscription_id && (
                  <form action={setMembershipAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="mode" value="none" />
                    <button className={btn2}>End membership</button>
                  </form>
                )}
              </div>
            </section>
          )}

          {/* Account details */}
          <section className={box}>
            <h2 className="font-display text-lg mb-3">Account details</h2>
            {manageable ? (
              <form action={updateAccountAction} className="space-y-3">
                <input type="hidden" name="id" value={p.id} />
                <div>
                  <label className={label} htmlFor="full_name">Full name</label>
                  <input id="full_name" name="full_name" defaultValue={p.full_name ?? ''} required className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="email">Email (sign-in)</label>
                  <input id="email" name="email" type="email" defaultValue={p.email} required className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" defaultValue={p.phone ?? ''} className={input} />
                </div>
                <button className={btn}>Save changes</button>
              </form>
            ) : (
              <p className="text-sm text-stone-600">
                {p.email}
                <br />
                <span className="text-xs text-stone-500">Admin accounts are managed in Supabase.</span>
              </p>
            )}
          </section>

          {/* Access */}
          {manageable && (
            <section className={box}>
              <h2 className="font-display text-lg mb-3">Sign-in</h2>
              <form action={setPasswordAction} className="space-y-2 mb-5">
                <input type="hidden" name="id" value={p.id} />
                <label className={label} htmlFor="password">Set a new password</label>
                <div className="flex gap-2">
                  <input id="password" name="password" type="text" minLength={8} maxLength={72} required autoComplete="off" placeholder="At least 8 characters" className={`${input} flex-1 min-w-0`} />
                  <button className={btn2}>Set</button>
                </div>
                <p className="text-[11px] text-stone-500">Handy for test accounts. Share real people&rsquo;s passwords only privately.</p>
              </form>
              <form action={setAccountStatusAction}>
                <input type="hidden" name="id" value={p.id} />
                {p.status === 'suspended' ? (
                  <>
                    <input type="hidden" name="status" value="active" />
                    <button className={btn}>Restore account</button>
                  </>
                ) : (
                  <>
                    <input type="hidden" name="status" value="suspended" />
                    <button className="rounded-lg border border-coral/50 bg-white px-4 py-2 text-sm text-coral hover:bg-coral/10">Suspend account</button>
                    <p className="text-[11px] text-stone-500 mt-1">They can&rsquo;t sign in until you restore them. Nothing is deleted.</p>
                  </>
                )}
              </form>
            </section>
          )}
        </div>

        {/* History */}
        {history && history.length > 0 && (
          <section className={`${box} mt-5`}>
            <h2 className="font-display text-lg mb-3">Admin history</h2>
            <ul className="space-y-1 text-sm text-stone-700">
              {history.map((h) => {
                const ctx = (h.context ?? {}) as { admin_action?: string };
                return (
                  <li key={h.id} className="flex gap-3">
                    <span className="text-stone-400 font-mono text-xs w-32 shrink-0">
                      {new Date(h.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span>{(ctx.admin_action ?? 'change').replace(/_/g, ' ')}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Danger zone */}
        {manageable && !isSelf && (
          <section className="mt-8 rounded-xl border border-coral/40 bg-white p-5">
            <h2 className="font-display text-lg text-coral mb-1">Delete account permanently</h2>
            <p className="text-sm text-stone-600 mb-4 leading-relaxed">
              Removes the account, their profile, membership, messages, uploaded files and anything tied to them,
              including bookings and reviews with other people. This can&rsquo;t be undone. Meant for test accounts;
              for a real person, suspending is usually the right call.
            </p>
            <form action={deleteAccountAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input
                name="confirm"
                required
                pattern="DELETE"
                autoComplete="off"
                placeholder="Type DELETE"
                aria-label="Type DELETE to confirm"
                className="w-40 rounded-lg border border-coral/40 px-3 py-2 text-sm"
              />
              <button className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral/90">
                Delete {p.full_name || 'this account'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
