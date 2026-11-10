/**
 * /admin/people — every family, caregiver and admin account, filterable.
 * The stat cards on /admin link here with ?role=client | cna | admin.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader, Flash, StatusPill } from '../AdminHeader';
import { STAGE_LABEL, type AppStage } from '../applications/stages';

export const dynamic = 'force-dynamic';

const ROLES = [
  { key: 'all', label: 'Everyone' },
  { key: 'client', label: 'Families' },
  { key: 'cna', label: 'Caregivers' },
  { key: 'admin', label: 'Admins' },
] as const;

const ROLE_LABEL: Record<string, string> = { client: 'Family', cna: 'Caregiver', admin: 'Admin', business: 'Facility (old)' };

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  last_active_at: string | null;
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; ok?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const role = ROLES.some((r) => r.key === sp.role) ? sp.role! : 'all';
  const q = (sp.q ?? '').trim().slice(0, 80);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, status, email').eq('id', user.id).single();
  if (me?.role !== 'admin' || me.status !== 'active') redirect('/login?error=not_authorized');

  let query = supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at, last_active_at')
    .neq('role', 'business')
    .order('created_at', { ascending: false })
    .limit(500);
  if (role !== 'all') query = query.eq('role', role as 'client' | 'cna' | 'admin');
  if (q) {
    const safe = q.replace(/[%,()]/g, ' ');
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  const { data: rows } = await query;
  const people = (rows ?? []) as Row[];

  const ids = people.map((p) => p.id);
  const [{ data: memberships }, { data: cnaRows }] = await Promise.all([
    ids.length
      ? supabase.from('memberships').select('user_id, status, founding').in('user_id', ids)
      : Promise.resolve({ data: [] as { user_id: string; status: string; founding: boolean }[] }),
    ids.length
      ? supabase.from('cna_profiles').select('user_id, application_status').in('user_id', ids)
      : Promise.resolve({ data: [] as { user_id: string; application_status: string | null }[] }),
  ]);
  const memberBy = new Map((memberships ?? []).map((m) => [m.user_id, m]));
  const stageBy = new Map((cnaRows ?? []).map((c) => [c.user_id, c.application_status]));

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminHeader section="People" email={me?.email} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl text-stone-900">People</h1>
            <p className="text-sm text-stone-600">Open anyone to edit, suspend, comp, view as, or delete.</p>
          </div>
          <Link
            href={`/admin/people/new${role === 'client' || role === 'cna' ? `?role=${role}` : ''}`}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            + Add account
          </Link>
        </div>

        <Flash ok={sp.ok} err={sp.err} />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {ROLES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/people?role=${r.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                role === r.key ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              {r.label}
            </Link>
          ))}
          <form className="ml-auto flex gap-2 w-full sm:w-auto" action="/admin/people">
            <input type="hidden" name="role" value={role} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or email"
              className="flex-1 sm:w-64 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm"
            />
            <button className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50">Search</button>
          </form>
        </div>

        {people.length === 0 ? (
          <p className="text-sm text-stone-500 italic py-10 text-center">Nobody matches.</p>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Account</th>
                  <th className="text-left px-4 py-3">Membership</th>
                  <th className="text-left px-4 py-3">Caregiver stage</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {people.map((p) => {
                  const m = memberBy.get(p.id);
                  const stage = stageBy.get(p.id) as AppStage | null | undefined;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/people/${p.id}`} className="block">
                          <span className="font-medium text-stone-900 hover:underline">{p.full_name || '(no name)'}</span>
                          <span className="block text-xs text-stone-500">{p.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-stone-700">{ROLE_LABEL[p.role] ?? p.role}</td>
                      <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                      <td className="px-4 py-3 text-stone-700">
                        {p.role === 'admin' ? '—' : m ? (
                          <>
                            {m.status === 'none' ? 'None' : m.status}
                            {m.founding && <span className="ml-1 text-xs text-amber-700">· founding</span>}
                          </>
                        ) : 'None'}
                      </td>
                      <td className="px-4 py-3 text-stone-700">{p.role === 'cna' && stage ? STAGE_LABEL[stage] ?? stage : '—'}</td>
                      <td className="px-4 py-3 text-stone-500">{new Date(p.created_at).toLocaleDateString('en-US')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-stone-400">{people.length} shown</p>
      </main>
    </div>
  );
}
