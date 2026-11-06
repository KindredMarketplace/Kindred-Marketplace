/**
 * POST /api/membership/checkout — start Stripe Checkout for Kindred membership.
 *
 * Membership = one-time startup fee + monthly subscription, priced from
 * public.access_plans. This is Kindred's own fee for ACCESS. It is never tied
 * to a caregiver's rate or hours.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { getMyAccess, getPlanForRole, isStripeConfigured } from '@/lib/membership';

export const dynamic = 'force-dynamic';

function back(req: NextRequest, path: string, params: Record<string, string>) {
  const url = new URL(path, req.nextUrl.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return back(req, '/login', { next: '/client/membership' });

  const access = await getMyAccess(supabase);
  const role = access?.role;
  if (role !== 'client' && role !== 'cna') {
    return NextResponse.json({ error: 'Memberships are for families and caregivers.' }, { status: 403 });
  }
  const home = role === 'cna' ? '/cna/membership' : '/client/membership';

  if (access?.is_member) return back(req, home, { status: 'already' });
  if (!isStripeConfigured()) return back(req, home, { status: 'not_open' });

  const plan = await getPlanForRole(supabase, role);
  if (!plan) return back(req, home, { status: 'no_plan' });

  // Reuse an existing Stripe customer if we have one (service role: the
  // memberships table is not writable by users).
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from('memberships')
    .select('stripe_customer_id, startup_fee_paid_at, startup_fee_waived')
    .eq('user_id', user.id)
    .maybeSingle();

  // Already have a subscription that isn't dead (e.g. past_due)? Send them to
  // the Stripe portal to fix payment instead of starting a second subscription.
  const { data: subRow } = await admin
    .from('memberships')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (subRow?.stripe_subscription_id && existing?.stripe_customer_id) {
    try {
      const stripe = getStripe();
      const live = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id);
      if (!['canceled', 'incomplete_expired'].includes(live.status)) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: existing.stripe_customer_id,
          return_url: `${req.nextUrl.origin}${home}`,
        });
        return NextResponse.redirect(portal.url, { status: 303 });
      }
    } catch (err) {
      console.error('[membership] could not check existing subscription', err instanceof Error ? err.message : err);
      return back(req, home, { status: 'error' });
    }
  }

  const chargeStartup =
    plan.startup_fee_cents > 0 && !existing?.startup_fee_paid_at && !existing?.startup_fee_waived;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user.id,
      customer: existing?.stripe_customer_id ?? undefined,
      customer_email: existing?.stripe_customer_id ? undefined : user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: plan.monthly_cents,
            recurring: { interval: 'month' },
            product_data: { name: plan.label, description: 'Access to Kindred. Cancel anytime.' },
          },
        },
        ...(chargeStartup
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: 'usd',
                  unit_amount: plan.startup_fee_cents,
                  product_data: { name: 'One-time startup fee' },
                },
              },
            ]
          : []),
      ],
      metadata: {
        user_id: user.id,
        role,
        plan_key: plan.key,
        startup_fee: chargeStartup ? '1' : '0',
      },
      subscription_data: { metadata: { user_id: user.id, role, plan_key: plan.key } },
      allow_promotion_codes: true,
      success_url: `${req.nextUrl.origin}${home}?status=success`,
      cancel_url: `${req.nextUrl.origin}${home}?status=canceled`,
    });
    if (!session.url) throw new Error('no checkout url');
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    console.error('[membership] checkout failed', err instanceof Error ? err.message : err);
    return back(req, home, { status: 'error' });
  }
}
