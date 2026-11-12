/**
 * /reset-password — choose a new password after opening the emailed link.
 * /auth/confirm signs the person in for this; without that, the link has
 * expired (or was opened in a different browser), so offer a new one.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AuthShell } from '@/components/AuthShell';
import { NewPasswordForm } from './NewPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let home = '/login';
  if (user) {
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
    home = me?.role === 'cna' ? '/cna/dashboard' : me?.role === 'admin' ? '/admin' : '/client/dashboard';
  }

  return (
    <AuthShell>
      {user ? (
        <>
          <div className="text-center mb-8">
            <div className="text-4xl mb-3" aria-hidden="true">🔒</div>
            <h1 className="font-display text-4xl font-medium tracking-tight mb-2">Choose a new password</h1>
            <p className="text-ink/60">At least 8 characters. A short sentence is easy to remember and hard to guess.</p>
          </div>
          <NewPasswordForm home={home} />
        </>
      ) : (
        <div className="text-center">
          <div className="text-4xl mb-3" aria-hidden="true">⏳</div>
          <h1 className="font-display text-3xl font-medium tracking-tight mb-2">This link has expired</h1>
          <p className="text-ink/60 mb-6">
            Reset links work once, for an hour, in the browser you open them in. Ask for a fresh one.
          </p>
          <Link href="/forgot-password" className="inline-block rounded-xl bg-deepteal px-5 py-2.5 font-medium text-cream hover:bg-deepteal/90">
            Send a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
