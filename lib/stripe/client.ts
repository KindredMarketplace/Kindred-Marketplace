/**
 * Client-side Stripe.js loader.
 *
 * Use this in 'use client' components that need Stripe Elements or Checkout.
 *
 * Example:
 *   const stripe = await getStripeClient();
 *   await stripe.redirectToCheckout({ sessionId: ... });
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

let _stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (!_stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe.js will fail to load.'
      );
    }
    _stripePromise = loadStripe(publishableKey ?? '');
  }
  return _stripePromise;
}
