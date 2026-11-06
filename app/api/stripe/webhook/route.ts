/**
 * Stripe webhook — keeps public.memberships in sync with Stripe Billing.
 *
 * Kindred is a platform, not an employer: Stripe here only ever bills
 * Kindred's OWN membership (startup fee + monthly). No care money flows
 * through Kindred, so there are no payment-intent / payout handlers.
 *
 * Events handled:
 *   checkout.session.completed      → membership active (+ startup fee paid)
 *   customer.subscription.updated   ┐ re-read the live subscription from
 *   customer.subscription.deleted   ├ Stripe and mirror its current status,
 *   invoice.payment_failed          ┘ so late / out-of-order events can't regress it
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
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        // Events can arrive late or out of order, so never trust the payload's
        // status: re-read the subscription from Stripe and mirror what's true now.
        const subId =
          event.type === 'invoice.payment_failed'
            ? idOf((event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null }).subscription ?? null)
            : (event.data.object as Stripe.Subscription).id;
        if (!subId) break;

        const live = await stripe.subscriptions.retrieve(subId);
        const status = fromStripeStatus(live.status);
        const periodEnd = periodEndIso(live);

        const { data: updated, error } = await supabase
          .from('memberships')
          .update({ status, current_period_end: periodEnd })
          .eq('stripe_subscription_id', subId)
          .select('user_id');
        if (error) throw error;

        if (!updated || updated.length === 0) {
          // Arrived before checkout.session.completed was processed. Fall back
          // to the user id we stamped on the subscription's metadata.
          const userId = live.metadata?.user_id;
          const role = live.metadata?.role;
          if (userId && (role === 'client' || role === 'cna') && status !== 'canceled') {
            const { error: upErr } = await supabase.from('memberships').upsert(
              {
                user_id: userId,
                role,
                status,
                plan_key: live.metadata?.plan_key ?? null,
                stripe_customer_id: idOf(live.customer as string | Stripe.Customer),
                stripe_subscription_id: subId,
                current_period_end: periodEnd,
              },
              { onConflict: 'user_id' }
            );
            if (upErr) throw upErr;
          } else {
            console.warn('[stripe] no membership matched subscription', subId, event.type);
          }
        }
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
