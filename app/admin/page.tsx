/**
 * /admin — admin home page.
 *
 * Server component. Lists every user grouped by role with "View as" buttons.
 * Also shows recent impersonation log entries for self-auditing.
 *
 * Access is gated by middleware (only role='admin' can reach this route)
 * AND by the in-page requireAdmin check (defense in depth).
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { startImpersonationAction } from './actions';
import { logoutAction } from '../(auth)/actions';

export const dynamic = 'force-dynamic'; // never cache — admin data should be live

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'client' | 'cna' | 'business' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  created_at: string;
};

type ImpersonationLogRow = {
  id: string;
  impersonated_user_id: string;
  impersonated_role: string;
  reason: string | null;
  started_at: string;
  ended_at: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify admin
  const { data: me } = await supabase
    .from('users')
    .select('role, status, full_name, email')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin' || me?.status !== 'active') {
    redirect('/login?error=not_authorized');
  }

  // Pull users (RLS allows admins to read all)
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at')
    .neq('id', user.id) // exclude self
    .order('created_at', { ascending: false });

  const grouped: Record<UserRow['role'], UserRow[]> = {
    client: [],
    cna: [],
    business: [],
    admin: [],
  };
  for (const u of (users ?? []) as UserRow[]) {
    grouped[u.role].push(u);
  }

  // Pull recent impersonation logs (only for the current admin)
  const { data: logs } = await supabase
    .from('admin_impersonation_log')
    .select('id, impersonated_user_id, impersonated_role, reason, started_at, ended_at')
    .eq('admin_user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(10);

  // CNA application pipeline — count anyone awaiting a human decision.
  const { data: appRows } = await supabase
    .from('cna_profiles')
    .select('application_status');
  const pendingApplications = (appRows ?? []).filter((r) =>
    ['submitted', 'interviewing', 'verifying'].includes(
      (r as { application_status: string | null }).application_status ?? '',
    ),
  ).length;

  // Funnel leads from the public landing page awaiting outreach.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leadRows } = await (supabase.from('leads') as any).select('status');
  const newLeads = (leadRows ?? []).filter(
    (r: { status: string | null }) => r.status === 'new',
  ).length;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-display text-xl">
              Kindred <span className="text-stone-400">/ Admin</span>
            </Link>
            <span className="rounded-full bg-coral/30 px-3 py-0.5 text-xs font-medium text-coral">
              Staff only
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-stone-400">{me?.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-stone-700 px-3 py-1.5 text-stone-300 hover:bg-stone-800"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-stone-900 mb-2">Admin dashboard</h1>
          <p className="text-stone-600">
            Welcome back, {me?.full_name || me?.email}. Pick a user below to walk the app
            as them, or browse user lists to spot issues.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Clients" count={grouped.client.length} accent="bg-sky" />
          <StatCard label="CNAs" count={grouped.cna.length} accent="bg-sage" />
          <StatCard label="Facilities" count={grouped.business.length} accent="bg-teal" />
          <StatCard label="Admins" count={grouped.admin.length + 1} accent="bg-coral" />
        </div>

        {/* CNA applications queue callout */}
        <Link
          href="/admin/applications"
          className="group flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 mb-10 hover:border-teal hover:shadow-sm transition"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal" />
              <span className="font-display text-lg text-stone-900">Caregiver applications</span>
            </div>
            <p className="text-sm text-stone-600 mt-1">
              Review applicants, run interviews, and approve only the ones who earn it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-teal/10 text-deepteal text-sm font-medium px-3 py-1">
              {pendingApplications} awaiting review
            </span>
            <span className="text-stone-400 group-hover:text-teal transition">&rarr;</span>
          </div>
        </Link>

        {/* Kindred Standard review queue */}
        <Link
          href="/admin/verifications"
          className="group flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 mb-10 hover:border-teal hover:shadow-sm transition"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-sage" />
              <span className="font-display text-lg text-stone-900">Document review</span>
            </div>
            <p className="text-sm text-stone-600 mt-1">
              Background checks, IDs and insurance caregivers uploaded for the Kindred Standard.
            </p>
          </div>
          <span className="text-stone-400 group-hover:text-teal transition">&rarr;</span>
        </Link>

        {/* Funnel leads callout */}
        <Link
          href="/admin/leads"
          className="group flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 mb-10 hover:border-coral hover:shadow-sm transition"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-coral" />
              <span className="font-display text-lg text-stone-900">Funnel leads</span>
            </div>
            <p className="text-sm text-stone-600 mt-1">
              People who raised their hand on the landing page. Reach out and mark them contacted.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-coral/10 text-coral text-sm font-medium px-3 py-1">
              {newLeads} new
            </span>
            <span className="text-stone-400 group-hover:text-coral transition">&rarr;</span>
          </div>
        </Link>

        {/* User lists by role */}
        <div className="space-y-10">
          <RoleSection
            title="Clients (families)"
            description="Walk in as a family looking for care."
            rows={grouped.client}
            accent="border-sky"
          />
          <RoleSection
            title="CNAs (caregivers)"
            description="See the world from a caregiver's perspective."
            rows={grouped.cna}
            accent="border-sage"
          />
          <RoleSection
            title="Businesses (facilities)"
            description="Step into a facility's shoes."
            rows={grouped.business}
            accent="border-teal"
          />
        </div>

        {/* Recent impersonation log */}
        <section className="mt-12">
          <h2 className="font-display text-2xl text-stone-900 mb-4">Your recent activity</h2>
          {logs && logs.length > 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">When</th>
                    <th className="text-left px-4 py-3">Viewed as</th>
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(logs as ImpersonationLogRow[]).map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 text-stone-700">
                        {new Date(l.started_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{l.impersonated_role}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 font-mono text-xs">
                        {l.impersonated_user_id.slice(0, 8)}&hellip;
                      </td>
                      <td className="px-4 py-3 text-stone-600">{l.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-stone-500">No impersonation history yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  count,
  accent,
}: {
  label: string;
  count: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${accent}`} />
        <span className="text-xs uppercase tracking-wider text-stone-500">{label}</span>
      </div>
      <div className="font-display text-3xl text-stone-900">{count}</div>
    </div>
  );
}

function RoleSection({
  title,
  description,
  rows,
  accent,
}: {
  title: string;
  description: string;
  rows: UserRow[];
  accent: string;
}) {
  return (
    <section>
      <div className={`mb-4 border-l-4 ${accent} pl-4`}>
        <h2 className="font-display text-2xl text-stone-900">{title}</h2>
        <p className="text-sm text-stone-600">{description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-stone-500 italic">No users yet.</p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-stone-900">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-stone-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={startImpersonationAction} className="inline">
                      <input type="hidden" name="target_user_id" value={u.id} />
                      <input type="hidden" name="reason" value="Manual review" />
                      <button
                        type="submit"
                        className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-teal/90"
                      >
                        View as
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: UserRow['status'] }) {
  const styles: Record<UserRow['status'], string> = {
    active: 'bg-sage/20 text-stone-800',
    pending: 'bg-stone-100 text-stone-600',
    suspended: 'bg-coral/20 text-stone-800',
    deleted: 'bg-stone-200 text-stone-500',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
