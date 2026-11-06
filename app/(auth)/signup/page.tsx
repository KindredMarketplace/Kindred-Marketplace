'use client';

/**
 * /signup — create a new account.
 *
 * Step 1: Pick Client / CNA / Business.
 *   - Client proceeds to step 2 (create account).
 *   - CNA redirects to /apply (the real application flow).
 *   - Business shows a "coming after launch" message and can't proceed.
 *
 * Step 2: Username + full name + password. No email required for now.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KindredMark } from '@/components/KindredMark';
import { signupAction, type SignupResult } from '../actions';

type Role = 'client' | 'cna' | 'business';

const ROLE_OPTIONS: Array<{
  value: Role;
  icon: string;
  title: string;
  description: string;
  available: boolean;
  unavailableNote: string;
  redirectTo?: string;
}> = [
  {
    value: 'client',
    icon: '👨‍👩‍👧',
    title: 'I\'m looking for care',
    description: 'For families or individuals who need a caregiver.',
    available: true,
    unavailableNote: '',
  },
  {
    value: 'cna',
    icon: '🩺',
    title: 'I\'m a caregiver (CNA)',
    description: 'For Certified Nursing Assistants. Start your application.',
    available: true,
    unavailableNote: '',
    redirectTo: '/apply',
  },
  {
    value: 'business',
    icon: '🏢',
    title: 'I represent a facility',
    description: 'For assisted living homes, agencies, and healthcare facilities.',
    available: false,
    unavailableNote: 'Facility accounts are coming after our consumer launch. If you run a facility and want early access, reach out through our Contact page and we\'ll add you to the list.',
  },
];

export default function SignupPage() {
  const [step, setStep] = useState<'pick-role' | 'fill-form'>('pick-role');
  const [role, setRole] = useState<Role | null>(null);
  const [blockedRole, setBlockedRole] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SignupResult | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await signupAction(formData);
      setResult(res);
    });
  }

  function pickRole(opt: typeof ROLE_OPTIONS[number]) {
    if (opt.redirectTo) {
      router.push(opt.redirectTo);
      return;
    }
    if (!opt.available) {
      setBlockedRole(blockedRole === opt.value ? null : opt.value);
      return;
    }
    setBlockedRole(null);
    setRole(opt.value);
    setStep('fill-form');
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-ink/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <KindredMark size={36} />
          <span className="font-display text-2xl font-medium tracking-tight">Kindred</span>
        </Link>
        <span className="text-sm text-ink/60">
          Have an account?{' '}
          <Link href="/login" className="text-deepteal font-medium hover:underline">Log in</Link>
        </span>
      </header>

      <main className="flex-1 px-6 py-12">

        {/* ── Step 1: pick a role ── */}
        {step === 'pick-role' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-3">
                What brings you to Kindred?
              </h1>
              <p className="text-ink/60 max-w-lg mx-auto">
                Choose the option that fits. You can always reach us if you&rsquo;re not sure.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex flex-col gap-0">
                  <button
                    type="button"
                    onClick={() => pickRole(opt)}
                    className={`text-left rounded-2xl border-2 bg-white p-6 transition focus:outline-none focus:ring-2 focus:ring-teal/30
                      ${opt.available
                        ? 'border-ink/10 hover:border-teal hover:shadow-md cursor-pointer'
                        : 'border-ink/10 cursor-pointer opacity-75 hover:opacity-100'
                      }
                      ${blockedRole === opt.value ? 'border-coral/40' : ''}
                    `}
                  >
                    <div className="text-3xl mb-3">{opt.icon}</div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-medium leading-snug">{opt.title}</h3>
                      {!opt.available && (
                        <span className="flex-shrink-0 mt-0.5 text-xs font-mono bg-creamdark text-ink/50 px-2 py-0.5 rounded-full">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/60 mt-1">{opt.description}</p>
                  </button>

                  {/* Inline message when a blocked role is tapped */}
                  {blockedRole === opt.value && (
                    <div className="rounded-b-2xl border-2 border-t-0 border-coral/30 bg-coral/5 px-5 py-3 text-sm text-ink/75 leading-relaxed">
                      {opt.unavailableNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: fill in details (client only) ── */}
        {step === 'fill-form' && (
          <div className="max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => { setStep('pick-role'); setResult(null); }}
              className="mb-6 text-sm text-ink/60 hover:text-ink inline-flex items-center gap-1"
            >
              ← Change account type
            </button>

            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sage/25 px-3 py-1 text-xs font-medium text-deepteal mb-3">
                <span>👨‍👩‍👧</span> Family account
              </div>
              <h1 className="font-display text-4xl font-medium tracking-tight mb-2">Create your account</h1>
              <p className="text-ink/60 text-sm">Pick a username and password — no email needed right now.</p>
            </div>

            {result && !result.ok && (
              <div role="alert" className="mb-5 rounded-2xl bg-coral/15 border border-coral/40 px-4 py-3 text-sm text-ink">
                {result.error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="role" value={role ?? ''} />

              {/* Full name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1.5">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                  placeholder="Jane Smith"
                />
                {result && !result.ok && result.fieldErrors?.full_name && (
                  <p className="mt-1 text-xs text-coral">{result.fieldErrors.full_name}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1.5">
                  Username
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
                  placeholder="jane_smith"
                />
                <p className="mt-1 text-xs text-ink/45">Letters, numbers, and underscores only. 3–30 characters.</p>
                {result && !result.ok && result.fieldErrors?.username && (
                  <p className="mt-1 text-xs text-coral">{result.fieldErrors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-ink placeholder:text-ink/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
                <p className="mt-1 text-xs text-ink/45">At least 8 characters.</p>
                {result && !result.ok && result.fieldErrors?.password && (
                  <p className="mt-1 text-xs text-coral">{result.fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-deepteal px-4 py-2.5 font-medium text-cream shadow-sm transition hover:bg-deepteal/90 focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-xs text-ink/45 text-center">
                By continuing you agree to Kindred&rsquo;s{' '}
                <Link href="/terms" className="underline hover:text-ink/70">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-ink/70">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        )}

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
