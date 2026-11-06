/**
 * MembershipPage — shared server component for /client/membership and
 * /cna/membership.
 *
 * Shows: where you stand, what it costs (from access_plans), and the one
 * action that makes sense. For caregivers it also shows progress against the
 * Kindred Standard, because being LISTED = standard met + membership.
 *
 * Honest by design: prices come from the DB, nothing is promised that the
 * platform doesn't do, and if Stripe isn't connected yet the page says so.
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getMyAccess, getPlanForRole, isStripeConfigured } from '@/lib/membership';
import { dollars, formatLongDate, statusLabel, KINDRED_STANDARD } from '@/lib/membership-shared';

const NOTICES: Record<string, { tone: 'good' | 'warn'; text: string }> = {
  success: { tone: 'good', text: 'Payment received. Your membership will show as active within a few seconds.' },
  canceled: { tone: 'warn', text: 'Checkout was canceled. Nothing was charged.' },
  not_open: { tone: 'warn', text: 'Memberships open at launch. You have not been charged.' },
  error: { tone: 'warn', text: 'Something went wrong starting checkout. Nothing was charged. Please try again.' },
  already: { tone: 'good', text: 'You are already a member.' },
  no_billing: { tone: 'warn', text: 'There is no card on file for this membership.' },
  no_plan: { tone: 'warn', text: 'Membership pricing is not set up yet.' },
};

export async function MembershipPage({ role, status }: { role: 'client' | 'cna'; status?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [access, plan, standard] = await Promise.all([
    getMyAccess(supabase),
    getPlanForRole(supabase, role),
    role === 'cna' && user ? loadStandardProgress(supabase, user.id) : Promise.resolve(null),
  ]);

  const stripeReady = isStripeConfigured();
  const isMember = access?.is_member ?? false;
  const periodEnd = formatLongDate(access?.current_period_end);
  const notice = status ? NOTICES[status] : undefined;
  const isCaregiver = role === 'cna';

  return (
    <main className="max-w-kindred mx-auto px-4 sm:px-6 py-10 pb-24">
      <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Membership</div>
      <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
        {isMember ? (
          <>You&apos;re <span className="italic font-medium text-gradient">in.</span></>
        ) : isCaregiver ? (
          <>Get <span className="italic font-medium text-gradient">listed</span> on Kindred.</>
        ) : (
          <>Meet the caregivers, <span className="italic font-medium text-gradient">for real.</span></>
        )}
      </h1>
      <p className="text-ink/70 mt-3 max-w-2xl leading-relaxed">
        {isCaregiver
          ? 'Kindred never takes a cut of what you earn. Families pay you directly, at the rate you set. Membership is how Kindred keeps the lights on and the bar high.'
          : 'Kindred never takes a cut of what you pay your caregiver. You hire them directly, at the rate they set. Membership is what unlocks names, photos and messaging.'}
      </p>

      {notice && (
        <div
          role="status"
          className={`mt-6 rounded-xl px-4 py-3 text-sm border ${notice.tone === 'good' ? 'bg-sage/15 border-sage/40 text-deepteal' : 'bg-butter/40 border-butter text-ink'}`}
        >
          {notice.text}
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-12 gap-6">
        {/* Status + action */}
        <section className="lg:col-span-7 bg-white border border-ink/10 rounded-3xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50">Your status</div>
              <div className="font-display text-2xl font-medium mt-1">
                {access ? statusLabel(access) : 'Not a member yet'}
              </div>
              {isMember && periodEnd && (
                <div className="text-sm text-ink/60 mt-1">
                  {access?.founding ? `Free through ${periodEnd}` : `Renews ${periodEnd}`}
                </div>
              )}
            </div>
            {access?.founding && (
              <span className="bg-butter text-deepteal text-xs font-medium px-3 py-1.5 rounded-full">
                ✦ Founding caregiver
              </span>
            )}
          </div>

          {plan && (
            <div className="mt-6 border-t border-ink/10 pt-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">{plan.label}</div>
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <div className="font-display text-4xl font-medium">
                    {dollars(plan.monthly_cents)}
                    <span className="text-base text-ink/50 font-sans">/month</span>
                  </div>
                </div>
                {plan.startup_fee_cents > 0 && (
                  <div className="text-sm text-ink/70 pb-1">
                    + {dollars(plan.startup_fee_cents)} one-time startup fee
                    {access?.founding && <span className="text-deepteal font-medium"> (waived for you)</span>}
                  </div>
                )}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-ink/80">
                {(isCaregiver
                  ? [
                      'Your profile shown to families looking for care near you',
                      'Apply to family job posts and message families directly',
                      'Keep 100% of your rate. Kindred never touches it.',
                      'Cancel anytime',
                    ]
                  : [
                      'Full names and photos of every caregiver who meets the Kindred Standard',
                      'Message caregivers and set up a call before you decide',
                      'Post what you need and let caregivers come to you',
                      'Pay your caregiver directly, with no agency markup. Cancel anytime.',
                    ]
                ).map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-deepteal">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            {isMember ? (
              access?.membership_status === 'active' ? (
                <form action="/api/membership/portal" method="post">
                  <button className="w-full sm:w-auto bg-white border border-ink/20 px-6 py-3 rounded-full text-sm font-medium hover:bg-mist transition">
                    Manage billing &amp; receipts
                  </button>
                </form>
              ) : (
                <p className="text-sm text-ink/60">No card on file. Nothing to manage.</p>
              )
            ) : isCaregiver && standard && !standard.approved ? (
              <p className="text-sm text-ink/70 bg-mist/60 rounded-xl p-4">
                Membership opens once your application is approved. Our founding caregivers get their
                first year free, startup fee included.
                {access?.founding_slots_left != null &&
                  ` ${access.founding_slots_left} founding ${access.founding_slots_left === 1 ? 'spot' : 'spots'} left.`}
              </p>
            ) : stripeReady ? (
              <form action="/api/membership/checkout" method="post">
                <button className="w-full sm:w-auto bg-deepteal text-cream px-8 py-3.5 rounded-full text-sm font-medium hover:bg-inkdark transition">
                  {access?.membership_status === 'past_due' || access?.membership_status === 'canceled'
                    ? 'Restart membership'
                    : 'Become a member'}
                </button>
                <p className="text-xs text-ink/50 mt-3">Secure checkout by Stripe. Cancel anytime from this page.</p>
              </form>
            ) : (
              <div>
                <button
                  disabled
                  className="w-full sm:w-auto bg-ink/10 text-ink/50 px-8 py-3.5 rounded-full text-sm font-medium cursor-not-allowed"
                >
                  Memberships open at launch
                </button>
                <p className="text-xs text-ink/50 mt-3">
                  We&apos;re finishing setup. You won&apos;t be charged anything until memberships open.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right column */}
        <aside className="lg:col-span-5 space-y-6">
          {isCaregiver && standard ? (
            <div className="bg-white border border-ink/10 rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-medium">The Kindred Standard</h2>
                {access?.is_listed ? (
                  <span className="text-xs bg-sage/25 text-deepteal px-2.5 py-1 rounded-full font-medium">Listed</span>
                ) : (
                  <span className="text-xs bg-ink/5 text-ink/60 px-2.5 py-1 rounded-full">Not listed yet</span>
                )}
              </div>
              <p className="text-xs text-ink/60 mt-1 mb-4">
                Families only see caregivers who meet every item, and who are members.
              </p>
              <ul className="space-y-3">
                {KINDRED_STANDARD.map((item) => {
                  const state = standard.items[item.key];
                  return (
                    <li key={item.key} className="flex gap-3 items-start">
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${state === 'done' ? 'bg-deepteal text-cream' : state === 'pending' ? 'bg-butter text-deepteal' : 'border border-ink/25 text-transparent'}`}
                        aria-hidden="true"
                      >
                        {state === 'done' ? '✓' : state === 'pending' ? '…' : '·'}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-ink/55">
                          {state === 'pending' ? 'Uploaded, waiting on review' : item.detail}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href="/cna/compliance" className="mt-5 inline-block text-sm text-deepteal hover:text-coral">
                Upload documents →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-ink/10 rounded-3xl p-6">
              <h2 className="font-display text-xl font-medium">Who you&apos;ll meet</h2>
              <p className="text-sm text-ink/70 mt-2 leading-relaxed">
                Every caregiver on Kindred has passed a personal interview, has at least 1,500 hours of
                hands-on experience, a Level 2 background check, a verified ID, and carries their own
                liability insurance.
              </p>
              <Link href="/kindred-standard" className="mt-4 inline-block text-sm text-deepteal hover:text-coral">
                Read the Kindred Standard →
              </Link>
            </div>
          )}

          <div className="bg-mist/50 border border-ink/10 rounded-3xl p-6 text-sm text-ink/75 leading-relaxed">
            <div className="font-display text-lg font-medium text-ink mb-2">How Kindred makes money</div>
            Only from memberships. We don&apos;t take a percentage of care, add a service fee to a
            caregiver&apos;s rate, or sit in the middle of what a family pays their caregiver. That&apos;s
            what keeps Kindred a platform and not an agency.
          </div>
        </aside>
      </div>
    </main>
  );
}

type ItemState = 'done' | 'pending' | 'todo';

async function loadStandardProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ approved: boolean; items: Record<string, ItemState> }> {
  const [{ data: profile }, { data: verifs }, { data: settings }] = await Promise.all([
    supabase.from('cna_profiles').select('application_status, experience_hours').eq('user_id', userId).maybeSingle(),
    supabase.from('cna_verifications').select('type, status, expires_at').eq('cna_id', userId),
    supabase.from('platform_settings').select('value').eq('key', 'kindred_standard_min_hours').maybeSingle(),
  ]);
  const minHours = settings?.value != null ? Number(settings.value) : 1500;
  const today = new Date().toISOString().slice(0, 10);

  const verifState = (type: string): ItemState => {
    const rows = (verifs ?? []).filter((v) => v.type === type);
    if (rows.some((v) => v.status === 'verified' && (!v.expires_at || v.expires_at >= today))) return 'done';
    if (rows.some((v) => v.status === 'pending')) return 'pending';
    return 'todo';
  };

  const approved = profile?.application_status === 'approved';
  return {
    approved,
    items: {
      interview: approved ? 'done' : profile?.application_status === 'submitted' ? 'pending' : 'todo',
      hours: (profile?.experience_hours ?? 0) >= minHours ? 'done' : 'todo',
      l2bg: verifState('l2bg'),
      identity: verifState('identity'),
      insurance: verifState('insurance'),
    },
  };
}
