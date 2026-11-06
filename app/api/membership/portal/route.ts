/**
 * POST /api/membership/portal — open the Stripe customer portal so members can
 * update their card, see receipts, or cancel. No Kindred UI to maintain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { isStripeConfigured } from '@/lib/membership';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.nextUrl.origin), { status: 303 });

  const { data: m } = await supabase
    .from('memberships')
    .select('stripe_customer_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
  const home = m?.role === 'cna' ? '/cna/membership' : '/client/membership';

  if (!m?.stripe_customer_id || !isStripeConfigured()) {
    return NextResponse.redirect(new URL(`${home}?status=no_billing`, req.nextUrl.origin), { status: 303 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: m.stripe_customer_id,
      return_url: `${req.nextUrl.origin}${home}`,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    console.error('[membership] portal failed', err instanceof Error ? err.message : err);
    return NextResponse.redirect(new URL(`${home}?status=error`, req.nextUrl.origin), { status: 303 });
  }
}
