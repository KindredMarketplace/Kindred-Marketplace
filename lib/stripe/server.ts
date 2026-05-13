/**
 * Server-side Stripe client. NEVER import this in client components.
 *
 * Stripe Connect setup notes:
 *   - We use the "destination charge" model: client pays Kindred, we transfer
 *     net-of-fee to the CNA's Connect account.
 *   - CNAs onboard via Stripe Express onboarding.
 *   - Funds are held until the corresponding shift transitions to 'completed'.
 *
 * Environment vars required:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - STRIPE_CONNECT_CLIENT_ID
 */

import Stripe from 'stripe';

// Lazy init — avoids creating the client at module load when env vars aren't set yet
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set. Grab a test key from ' +
          'https://dashboard.stripe.com/test/apikeys and add it to .env.local'
      );
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
      typescript: true,
      // Add a marker so we can identify Kindred-originated requests in Stripe logs
      appInfo: {
        name: 'Kindred Marketplace',
        version: '0.1.0',
      },
    });
  }
  return _stripe;
}
