/**
 * /admin/people/new — create a family or caregiver account by hand
 * (test accounts, or someone Kindred is onboarding personally).
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminHeader, Flash } from '../../AdminHeader';
import { createAccountAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, status, email').eq('id', user.id).single();
  if (me?.role !== 'admin' || me.status !== 'active') redirect('/login?error=not_authorized');

  const role = sp.role === 'cna' ? 'cna' : 'client';
  const label = 'block text-xs font-medium text-stone-600 mb-1';
  const input = 'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm';

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminHeader section="People" email={me?.email} />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/admin/people" className="text-sm text-stone-500 hover:text-stone-900">← People</Link>
        <h1 className="font-display text-3xl text-stone-900 mt-3 mb-2">Add an account</h1>
        <p className="text-sm text-stone-600 mb-6">
          They can sign in right away with this email and password. A caregiver added here starts in
          &ldquo;Submitted&rdquo; in Applications, like anyone who applied.
        </p>
        <Flash err={sp.err} />
        <form action={createAccountAction} className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
          <fieldset>
            <legend className={label}>Account type</legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" value="client" defaultChecked={role === 'client'} /> Family
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" value="cna" defaultChecked={role === 'cna'} /> Caregiver
              </label>
            </div>
          </fieldset>
          <div>
            <label className={label} htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="password">Password</label>
            <input id="password" name="password" type="text" minLength={8} maxLength={72} required autoComplete="off" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="phone">Phone (optional)</label>
            <input id="phone" name="phone" type="tel" className={input} />
          </div>
          <button className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800">
            Create account
          </button>
        </form>
      </main>
    </div>
  );
}
