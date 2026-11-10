/**
 * /admin/leads — the funnel inbox.
 *
 * Every submission from the public landing page (kindredmarketplace.com) lands
 * in the `leads` table. This is where you read them, see which channel they came
 * from (?src= on the QR / ad), and mark who you've reached out to.
 *
 * Server component. Admin-gated in-page (defense in depth alongside middleware).
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateLeadStatusAction } from './actions';
import { AdminHeader } from '../AdminHeader';

export const dynamic = 'force-dynamic';

type Lead = {
  id: string;
  role: 'caregiver' | 'family' | 'other';
  name: string;
  contact: string;
  note: string | null;
  source: string;
  status: 'new' | 'contacted' | 'archived';
  created_at: string;
};

const ROLE_LABEL: Record<Lead['role'], string> = {
  caregiver: 'Caregiver',
  family: 'Needs care',
  other: 'Exploring',
};
const ROLE_ACCENT: Record<Lead['role'], string> = {
  caregiver: 'bg-sage/25 text-stone-800',
  family: 'bg-sky/25 text-stone-800',
  other: 'bg-stone-100 text-stone-600',
};

export default async function AdminLeadsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users')
    .select('role, status, email, full_name')
    .eq('id', user.id)
    .single();
  if (me?.role !== 'admin' || me?.status !== 'active') {
    redirect('/login?error=not_authorized');
  }

  // Admins can read all leads (leads_admin_all RLS policy).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('leads') as any)
    .select('id, role, name, contact, note, source, status, created_at')
    .order('created_at', { ascending: false });

  const leads = (data ?? []) as Lead[];
  const active = leads.filter((l) => l.status !== 'archived');
  const counts = {
    new: leads.filter((l) => l.status === 'new').length,
    caregiver: leads.filter((l) => l.role === 'caregiver' && l.status !== 'archived').length,
    family: leads.filter((l) => l.role === 'family' && l.status !== 'archived').length,
    other: leads.filter((l) => l.role === 'other' && l.status !== 'archived').length,
  };
  const archived = leads.filter((l) => l.status === 'archived');

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminHeader section="Leads" />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-stone-900 mb-2">Funnel leads</h1>
          <p className="text-stone-600">
            Everyone who raised their hand on kindredmarketplace.com. Reach out, then mark them
            contacted so you don&apos;t lose track.
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mb-10">
          <Stat label="New — reach out" count={counts.new} accent="bg-coral" />
          <Stat label="Caregivers" count={counts.caregiver} accent="bg-sage" />
          <Stat label="Need care" count={counts.family} accent="bg-sky" />
          <Stat label="Exploring" count={counts.other} accent="bg-teal" />
        </div>

        {active.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
            <p className="font-display text-2xl text-stone-900 mb-2">No leads yet.</p>
            <p className="text-stone-600 text-sm">
              As people submit the landing page, they&apos;ll appear here — newest first, with the
              channel they came from.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Who</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">When</th>
                  <th className="text-right px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {active.map((l) => (
                  <tr key={l.id} className={l.status === 'new' ? 'bg-amber-50/40' : ''}>
                    <td className="px-4 py-3">
                      <div className="text-stone-900 font-medium">{l.name}</div>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_ACCENT[l.role]}`}>
                        {ROLE_LABEL[l.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-700 break-all">{l.contact}</td>
                    <td className="px-4 py-3 text-stone-600 max-w-xs">{l.note || <span className="text-stone-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 text-stone-600 px-2 py-0.5 text-xs font-mono">{l.source}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {l.status === 'new' ? (
                          <ActionBtn id={l.id} status="contacted" label="Mark contacted" primary />
                        ) : (
                          <span className="rounded-full bg-sage/20 text-stone-700 px-2.5 py-0.5 text-xs font-medium">contacted</span>
                        )}
                        <ActionBtn id={l.id} status="archived" label="Archive" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {archived.length > 0 && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm text-stone-500 hover:text-stone-700">
              {archived.length} archived
            </summary>
            <div className="mt-3 rounded-xl border border-stone-200 bg-white overflow-hidden opacity-75">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-stone-100">
                  {archived.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-2.5 text-stone-700">{l.name} <span className="text-stone-400">· {ROLE_LABEL[l.role]}</span></td>
                      <td className="px-4 py-2.5 text-stone-500 break-all">{l.contact}</td>
                      <td className="px-4 py-2.5 text-right">
                        <ActionBtn id={l.id} status="new" label="Restore" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

function Stat({ label, count, accent }: { label: string; count: number; accent: string }) {
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

function ActionBtn({ id, status, label, primary }: { id: string; status: string; label: string; primary?: boolean }) {
  return (
    <form action={updateLeadStatusAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={
          primary
            ? 'rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-teal/90'
            : 'rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100'
        }
      >
        {label}
      </button>
    </form>
  );
}
