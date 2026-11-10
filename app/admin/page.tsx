/**
 * /admin — overview.
 *
 *   - People counts (families, caregivers, admins); each card opens the list.
 *   - Membership + money: who's paying, comped, founding slots, and the
 *     monthly revenue those memberships add up to. Computed from Kindred's
 *     own records (memberships + access_plans); Stripe stays the source of
 *     truth for actual payouts once live payments are on.
 *   - Work queues: applications, documents to review, leads.
 *   - Recently joined + your recent "View as" history.
 *
 * Facilities are gone from the product (in-home care only); the old business
 * account isn't counted.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isStripeConfigured } from '@/lib/membership';
import { AdminHeader, StatusPill } from './AdminHeader';

export const dynamic = 'force-dynamic';

type Role = 'client' | 'cna' | 'admin';

const usd = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users')
    .select('role, status, full_name, email')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin' || me?.status !== 'active') redirect('/login?error=not_authorized');

  const [
    { data: users },
    { data: memberships },
    { data: plans },
    { data: settings },
    { data: appRows },
    { data: pendingDocs },
    { data: leadRows },
    { data: logs },
  ] = await Promise.all([
    supabase.from('users').select('id, email, full_name, role, status, created_at').neq('role', 'business').order('created_at', { ascending: false }),
    supabase.from('memberships').select('user_id, role, status, founding, startup_fee_waived, startup_fee_paid_at, stripe_subscription_id'),
    supabase.from('access_plans').select('role, startup_fee_cents, monthly_cents').eq('active', true),
    supabase.from('platform_settings').select('value').eq('key', 'founding_caregiver_cap').maybeSingle(),
    supabase.from('cna_profiles').select('application_status'),
    supabase.from('cna_verifications').select('id').eq('status', 'pending'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('leads') as any).select('status'),
    supabase
      .from('admin_impersonation_log')
      .select('id, impersonated_user_id, impersonated_role, started_at')
      .eq('admin_user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(8),
  ]);

  const people = (users ?? []) as { id: string; email: string; full_name: string | null; role: Role; status: string; created_at: string }[];
  const count = (r: Role) => people.filter((p) => p.role === r).length;
  const nameById = new Map(people.map((p) => [p.id, p.full_name || p.email]));

  // ---- membership + money
  const ms = memberships ?? [];
  const planFor = (role: string) => (plans ?? []).find((p) => p.role === role);
  const side = (role: 'cna' | 'client') => {
    const rows = ms.filter((m) => m.role === role);
    const paying = rows.filter((m) => m.status === 'active' || m.status === 'past_due');
    return {
      paying: paying.length,
      pastDue: rows.filter((m) => m.status === 'past_due').length,
      comped: rows.filter((m) => m.status === 'comped').length,
      canceled: rows.filter((m) => m.status === 'canceled').length,
      monthlyCents: rows.filter((m) => m.status === 'active').length * (planFor(role)?.monthly_cents ?? 0),
      startupCents: rows.filter((m) => m.startup_fee_paid_at && !m.startup_fee_waived).length * (planFor(role)?.startup_fee_cents ?? 0),
    };
  };
  const cg = side('cna');
  const fam = side('client');
  const foundingCap = settings?.value != null ? Number(settings.value) : 25;
  const foundingUsed = ms.filter((m) => m.founding && m.role === 'cna').length;
  const stripeLive = isStripeConfigured();

  // ---- queues
  const stages = (appRows ?? []).map((r) => r.application_status ?? '');
  const newApps = stages.filter((s) => s === 'submitted').length;
  const inInterview = stages.filter((s) => s === 'interviewing').length;
  const onboarding = stages.filter((s) => s === 'verifying').length;
  const listedish = stages.filter((s) => s === 'approved').length;
  const docsToReview = (pendingDocs ?? []).length;
  const newLeads = ((leadRows ?? []) as { status: string | null }[]).filter((r) => r.status === 'new').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminHeader section="Overview" email={me?.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-stone-900">Hi, {(me?.full_name || 'there').split(' ')[0]}</h1>
          <p className="text-sm text-stone-600">Everything at a glance. Tap any card to open it.</p>
        </div>

        {/* People */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard href="/admin/people?role=client" label="Families" value={count('client')} accent="bg-sky" />
          <StatCard href="/admin/people?role=cna" label="Caregivers" value={count('cna')} accent="bg-sage" sub={`${listedish} approved`} />
          <StatCard href="/admin/people?role=admin" label="Admins" value={count('admin')} accent="bg-coral" />
          <StatCard href="/admin/people/new" label="Add someone" value="+" accent="bg-stone-400" sub="Family or caregiver" />
        </div>

        {/* Money */}
        <section className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <h2 className="font-display text-2xl text-stone-900">Memberships &amp; revenue</h2>
            <span className={`text-xs rounded-full px-2.5 py-1 ${stripeLive ? 'bg-sage/25 text-stone-800' : 'bg-amber-100 text-amber-800'}`}>
              {stripeLive ? 'Payments on' : 'Payments not live yet: nobody can be charged'}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Metric label="Monthly revenue (MRR)" value={usd(cg.monthlyCents + fam.monthlyCents)} sub={`${cg.paying + fam.paying} paying member${cg.paying + fam.paying === 1 ? '' : 's'}`} />
            <Metric label="Startup fees collected" value={usd(cg.startupCents + fam.startupCents)} sub="As recorded by Kindred" />
            <Metric label="Founding caregivers" value={`${foundingUsed} / ${foundingCap}`} sub={`${Math.max(0, foundingCap - foundingUsed)} free-year spots left`} />
            <Metric label="Comped" value={String(cg.comped + fam.comped)} sub="Free access, not counted in revenue" />
          </div>
          <div className="mt-3 rounded-xl border border-stone-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5">Side</th>
                  <th className="text-right px-4 py-2.5">Paying</th>
                  <th className="text-right px-4 py-2.5">Past due</th>
                  <th className="text-right px-4 py-2.5">Comped</th>
                  <th className="text-right px-4 py-2.5">Canceled</th>
                  <th className="text-right px-4 py-2.5">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  { name: 'Caregivers', s: cg },
                  { name: 'Families', s: fam },
                ].map(({ name, s }) => (
                  <tr key={name}>
                    <td className="px-4 py-2.5 text-stone-900">{name}</td>
                    <td className="px-4 py-2.5 text-right">{s.paying}</td>
                    <td className="px-4 py-2.5 text-right">{s.pastDue}</td>
                    <td className="px-4 py-2.5 text-right">{s.comped}</td>
                    <td className="px-4 py-2.5 text-right">{s.canceled}</td>
                    <td className="px-4 py-2.5 text-right">{usd(s.monthlyCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Revenue is memberships only: {usd(planFor('cna')?.startup_fee_cents ?? 0)} to start + {usd(planFor('cna')?.monthly_cents ?? 0)}/month per side.
            Profit and costs (background checks, tools) come later, once there&rsquo;s real money to track.
          </p>
        </section>

        {/* Queues */}
        <section className="mb-8">
          <h2 className="font-display text-2xl text-stone-900 mb-3">To do</h2>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            <QueueCard
              href="/admin/applications"
              title="Caregiver applications"
              dot="bg-teal"
              lines={[`${newApps} new`, `${inInterview} in interview`, `${onboarding} onboarding`]}
            />
            <QueueCard href="/admin/verifications" title="Documents to review" dot="bg-sage" lines={[`${docsToReview} waiting`]} />
            <QueueCard href="/admin/leads" title="Funnel leads" dot="bg-coral" lines={[`${newLeads} new`]} />
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recently joined */}
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="font-display text-2xl text-stone-900">Recently joined</h2>
              <Link href="/admin/people" className="text-sm text-stone-500 hover:text-stone-900">Everyone →</Link>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
              {people.filter((p) => p.id !== user.id).slice(0, 6).map((p) => (
                <Link key={p.id} href={`/admin/people/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-900 truncate">{p.full_name || p.email}</div>
                    <div className="text-xs text-stone-500">
                      {p.role === 'cna' ? 'Caregiver' : p.role === 'client' ? 'Family' : 'Admin'} ·{' '}
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </Link>
              ))}
              {people.length <= 1 && <p className="px-4 py-6 text-sm text-stone-500">Nobody yet.</p>}
            </div>
          </section>

          {/* View-as history */}
          <section>
            <h2 className="font-display text-2xl text-stone-900 mb-3">Your recent &ldquo;View as&rdquo;</h2>
            {logs && logs.length > 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="text-stone-900 truncate">
                      {nameById.get(l.impersonated_user_id) ?? 'Deleted account'}{' '}
                      <span className="text-stone-500">({l.impersonated_role === 'cna' ? 'caregiver' : 'family'})</span>
                    </span>
                    <span className="text-xs text-stone-500 whitespace-nowrap">
                      {new Date(l.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">None yet. Open someone in People and tap &ldquo;View as them&rdquo;.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ href, label, value, accent, sub }: { href: string; label: string; value: number | string; accent: string; sub?: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-stone-200 bg-white p-4 sm:p-5 hover:border-stone-400 hover:shadow-sm transition">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${accent}`} />
        <span className="text-xs uppercase tracking-wider text-stone-500">{label}</span>
        <span className="ml-auto text-stone-300 group-hover:text-stone-600 transition">→</span>
      </div>
      <div className="font-display text-3xl text-stone-900">{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-1">{sub}</div>}
    </Link>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">{label}</div>
      <div className="font-display text-3xl text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 mt-1">{sub}</div>
    </div>
  );
}

function QueueCard({ href, title, dot, lines }: { href: string; title: string; dot: string; lines: string[] }) {
  return (
    <Link href={href} className="group rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-400 hover:shadow-sm transition">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span className="font-display text-lg text-stone-900">{title}</span>
        <span className="ml-auto text-stone-300 group-hover:text-stone-600 transition">→</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-stone-600">
        {lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </Link>
  );
}
