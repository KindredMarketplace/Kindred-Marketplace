'use client';

/**
 * /login — universal login page.
 * Username + password. Server reads role and routes to the right dashboard.
 */

import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { KindredWordmark } from '@/components/KindredMark';
import { loginAction, type LoginResult } from '../actions';

export default function LoginPage() {
  // useSearchParams() needs a Suspense boundary so /login can be prerendered.
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === '1';

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LoginResult | null>(null);

  async function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await loginAction(formData);
      setResult(res);
    });
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-ink/10">
        <Link href="/" className="flex items-center gap-2.5">
          <KindredWordmark height={34} />
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-medium tracking-tight mb-2">Welcome back</h1>
            <p className="text-ink/60">Log in to your Kindred account.</p>
          </div>

          {justCreated && (
            <div className="mb-6 rounded-2xl bg-sage/20 border border-sage/40 px-4 py-3 text-sm text-ink">
              Account created! Log in below.
            </div>
          )}

          {result && !result.ok && (
            <div role="alert" className="mb-6 rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
              {result.error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="next" value={searchParams.get('next') ?? ''} />
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1.5">
                Username or email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                placeholder="your_username or you@email.com"
              />
              {result && !result.ok && result.fieldErrors?.username && (
                <p className="mt-1 text-xs text-coral">{result.fieldErrors.username}</p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
              {result && !result.ok && result.fieldErrors?.password && (
                <p className="mt-1 text-xs text-coral">{result.fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-deepteal px-4 py-2.5 font-medium text-cream shadow-sm transition hover:bg-deepteal/90 focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            New to Kindred?{' '}
            <Link href="/signup" className="text-deepteal font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-6 py-5 text-center text-xs text-ink/40">
        <Link href="/terms" className="hover:text-ink/70 underline">Terms</Link>
        {' · '}
        <Link href="/privacy" className="hover:text-ink/70 underline">Privacy</Link>
        {' · '}
        <span>© 2026 Kindred Marketplace LLC</span>
      </footer>
    </div>
  );
}
