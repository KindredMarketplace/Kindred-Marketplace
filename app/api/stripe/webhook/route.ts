/**
 * Stripe webhook handler.
 *
 * Mounted at /api/stripe/webhook. Configure in Stripe Dashboard →
 * Developers → Webhooks → Add endpoint:
 *   - URL: https://your-domain.com/api/stripe/webhook
 *   - Events: payment_intent.succeeded, payment_intent.payment_failed,
 *             charge.refunded, account.updated, transfer.created, transfer.failed
 *   - Copy the signing secret into STRIPE_WEBHOOK_SECRET
 *
 * This handler:
 *   1. Verifies the Stripe signature (rejects forged requests)
 *   2. Routes the event to the right side-effect (update payments row,
 *      release escrow, send notification, etc.)
 *
 * Most of the logic is stubbed — wire these up as the booking + payment
 * flows come online.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'missing_signature_or_secret' },
      { status: 400 }
    );
  }

  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('Stripe webhook signature failed:', message);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  // Service-role client — webhooks need to bypass RLS to update payment rows
  // owned by other users.
  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        // TODO: Update public.payments where stripe_payment_intent_id = event.data.object.id
        // Set status='captured', captured_at=now()
        console.log('[stripe] payment_intent.succeeded', event.data.object.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        // TODO: Mark payment as failed, send notification, retry logic
        console.log('[stripe] payment_intent.payment_failed', event.data.object.id);
        break;
      }
      case 'charge.refunded': {
        // TODO: Insert refunds row, update payment status
        console.log('[stripe] charge.refunded', event.data.object.id);
        break;
      }
      case 'account.updated': {
        // CNA Connect account changed — sync stripe_onboarding_complete
        console.log('[stripe] account.updated', event.data.object.id);
        break;
      }
      case 'transfer.created':
      case 'transfer.failed': {
        // CNA payout status change
        console.log('[stripe] transfer event', event.type, event.data.object.id);
        break;
      }
      default:
        // Unhandled event type — return 200 so Stripe doesn't keep retrying
        console.log('[stripe] unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('[stripe] handler error:', err);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
