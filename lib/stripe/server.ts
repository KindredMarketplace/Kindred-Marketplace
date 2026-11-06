/**
 * Server-side Stripe client. NEVER import this in client components.
 *
 * Kindred uses Stripe ONLY to bill its own membership (Checkout + Billing).
 * Platform, not employer: no Connect, no payouts, no care payments.
 *
 * Environment vars:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes('PASTE')) {
      throw new Error('STRIPE_SECRET_KEY is not set.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
      appInfo: { name: 'Kindred Marketplace', version: '0.2.0' },
    });
  }
  return _stripe;
}
