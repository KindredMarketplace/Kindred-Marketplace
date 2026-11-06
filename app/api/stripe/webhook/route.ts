/**
 * Stripe webhook — keeps public.memberships in sync with Stripe Billing.
 *
 * Kindred is a platform, not an employer: Stripe here only ever bills
 * Kindred's OWN membership (startup fee + monthly). No care money flows
 * through Kindred, so there are no payment-intent / payout handlers.
 *
 * Events handled:
 *   checkout.session.completed      → membership active (+ startup fee paid)
 *   customer.subscription.updated   → mirror status + period end
 *   customer.subscription.deleted   → canceled
 *   invoice.payment_failed          → past_due
 */

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fromStripeStatus } from '@/lib/membership-shared';

export const dynamic = 'force-dynamic';

function periodEndIso(sub: Stripe.Subscription): string | null {
  const s = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  const secs = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return typeof secs === 'number' ? new Date(secs * 1000).toISOString() : null;
}

function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === 'string' ? x : x.id;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || webhookSecret.includes('PASTE')) {
    return NextResponse.json({ error: 'missing_signature_or_secret' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const role = session.metadata?.role;
        const planKey = session.metadata?.plan_key ?? null;
        if (!userId || (role !== 'client' && role !== 'cna')) {
          console.warn('[stripe] checkout.session.completed without a Kindred user', session.id);
          break;
        }
        const subId = idOf(session.subscription as string | Stripe.Subscription | null);
        let periodEnd: string | null = null;
        let status: 'active' | 'past_due' | 'canceled' | 'none' = 'active';
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          periodEnd = periodEndIso(sub);
          status = fromStripeStatus(sub.status) as typeof status;
        }
        const { error } = await supabase.from('memberships').upsert(
          {
            user_id: userId,
            role,
            status,
            plan_key: planKey,
            stripe_customer_id: idOf(session.customer as string | Stripe.Customer | null),
            stripe_subscription_id: subId,
            current_period_end: periodEnd,
            startup_fee_paid_at: session.metadata?.startup_fee === '1' ? new Date().toISOString() : undefined,
          },
          { onConflict: 'user_id' }
        );
        if (error) throw error;
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : fromStripeStatus(sub.status);
        const { error } = await supabase
          .from('memberships')
          .update({ status, current_period_end: periodEndIso(sub) })
          .eq('stripe_subscription_id', sub.id);
        if (error) throw error;
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null };
        const subId = idOf(invoice.subscription ?? null);
        if (!subId) break;
        const { error } = await supabase
          .from('memberships')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId);
        if (error) throw error;
        break;
      }

      default:
        // Not something we act on. 200 so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error('[stripe] webhook handler failed for', event.type, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
