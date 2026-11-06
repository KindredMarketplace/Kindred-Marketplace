/**
 * /admin/verifications — the Kindred Standard review queue.
 *
 * Every caregiver upload (Level 2 background check, photo ID, liability
 * insurance) waiting for a decision, oldest first, plus anything verified that
 * expires in the next 30 days. Click through to the caregiver's page to open
 * the file and verify / reject it in the Kindred Standard panel.
 *
 * Admin-gated in-page (defense in depth alongside middleware).
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const LABEL: Record<string, string> = {
  l2bg: 'Level 2 background',
  identity: 'Photo ID',
  insurance: 'Liability insurance',
};

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, status').eq('id', user.id).single();
  if (me?.role !== 'admin' || me?.status !== 'active') redirect('/login?error=not_authorized');

  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: pending }, { data: expiring }] = await Promise.all([
    supabase
      .from('cna_verifications')
      .select('id, cna_id, type, expires_at, updated_at')
      .in('type', ['l2bg', 'identity', 'insurance'])
      .eq('status', 'pending')
      .order('updated_at', { ascending: true }),
    supabase
      .from('cna_verifications')
      .select('id, cna_id, type, expires_at')
      .in('type', ['l2bg', 'identity', 'insurance'])
      .eq('status', 'verified')
      .gte('expires_at', today)
      .lte('expires_at', soon)
      .order('expires_at', { ascending: true }),
  ]);

  const ids = Array.from(new Set([...(pending ?? []), ...(expiring ?? [])].map((r) => r.cna_id)));
  const { data: people } = ids.length
    ? await supabase.from('cna_profiles').select('user_id, display_name, last_name').in('user_id', ids)
    : { data: [] as { user_id: string; display_name: string; last_name: string | null }[] };
  const nameOf = (id: string) => {
    const p = (people ?? []).find((x) => x.user_id === id);
    return p ? `${p.display_name}${p.last_name ? ` ${p.last_name}` : ''}` : 'Caregiver';
  };
  const ago = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-display text-xl">
              Kindred <span className="text-stone-400">/ Admin</span>
            </Link>
            <span className="rounded-full bg-teal/30 px-3 py-0.5 text-xs font-medium text-sky">Verifications</span>
          </div>
          <Link href="/admin" className="text-sm text-stone-300 hover:text-white">&larr; Back to dashboard</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="font-display text-3xl text-stone-900 mb-2">Kindred Standard review queue</h1>
          <p className="text-stone-600">
            Documents caregivers uploaded that need a yes or no. Open the caregiver, view the file,
            and verify or reject it with its expiration date.
          </p>
        </div>

        <section>
          <h2 className="font-medium text-stone-800 mb-3">Waiting for review ({pending?.length ?? 0})</h2>
          {pending && pending.length > 0 ? (
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {pending.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/applications/${r.cna_id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50"
                  >
                    <div>
                      <div className="font-medium text-stone-900">{nameOf(r.cna_id)}</div>
                      <div className="text-sm text-stone-600">
                        {LABEL[r.type] ?? r.type}
                        {r.expires_at ? ` · expires ${r.expires_at}` : ''}
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">uploaded {ago(r.updated_at)} &rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-sm text-stone-500">
              Nothing waiting. New uploads show up here.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-medium text-stone-800 mb-3">Verified, expiring in the next 30 days ({expiring?.length ?? 0})</h2>
          {expiring && expiring.length > 0 ? (
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {expiring.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/applications/${r.cna_id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50"
                  >
                    <div>
                      <div className="font-medium text-stone-900">{nameOf(r.cna_id)}</div>
                      <div className="text-sm text-stone-600">{LABEL[r.type] ?? r.type}</div>
                    </div>
                    <span className="text-xs text-coral">expires {r.expires_at} &rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-sm text-stone-500">
              Nothing expiring soon.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
