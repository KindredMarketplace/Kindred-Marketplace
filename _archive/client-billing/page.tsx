/**
 * /client/billing — billing & receipts. Ported from Client-Portal/billing.html.
 * Shell lives in app/client/layout.tsx.
 *
 * Real-data-only: spend totals and the receipts table come from the payments
 * table (joined to this client's bookings). When there are no payments yet, we
 * show a clean $0 state and an empty receipts table — never the mock's "$624 /
 * Maria R." filler. The LTC-reimbursement card stays (it's a feature offer, not
 * fabricated data).
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils/money';
import { initials, avatarClass } from '@/lib/utils/avatar';

export const dynamic = 'force-dynamic';

export default async function ClientBillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // This client's bookings → payments against them.
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, cna_id')
    .eq('client_id', user.id);

  const bookingIds = (bookings ?? []).map((b) => b.id);

  type PaymentRow = {
    id: string;
    booking_id: string;
    amount_cents: number;
    kindred_fee_cents: number | null;
    status: string;
    created_at: string;
  };
  let payments: PaymentRow[] = [];
  if (bookingIds.length > 0) {
    const { data } = await supabase
      .from('payments')
      .select('id, booking_id, amount_cents, kindred_fee_cents, status, created_at')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false })
      .limit(50);
    payments = data ?? [];
  }

  // Map cna_id per booking for the receipt rows.
  const cnaByBooking = new Map<string, string>();
  (bookings ?? []).forEach((b) => cnaByBooking.set(b.id, b.cna_id));
  const cnaIds = Array.from(new Set(Array.from(cnaByBooking.values())));
  const cnaNames = new Map<string, string>();
  if (cnaIds.length > 0) {
    const { data: cnas } = await supabase
      .from('cna_profiles')
      .select('user_id, display_name, last_name')
      .in('user_id', cnaIds);
    (cnas ?? []).forEach((c) =>
      cnaNames.set(c.user_id, `${c.display_name}${c.last_name ? ' ' + c.last_name[0] + '.' : ''}`),
    );
  }

  // Month-to-date spend.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPayments = payments.filter((p) => new Date(p.created_at) >= monthStart);
  const monthSpendCents = monthPayments.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const hasPayments = payments.length > 0;

  return (
    <main className="max-w-kindred mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Money</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          <span className="italic font-medium text-gradient">Billing</span> &amp; receipts.
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          No surprises. You'll only ever pay for hours actually worked — and you can pause anything,
          anytime.
        </p>
      </section>

      {/* THIS MONTH SUMMARY */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hero spend card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cream/10 blur-3xl" />
            <div className="relative">
              <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-2">
                {monthLabel} · in progress
              </div>
              <div className="font-display text-7xl font-light leading-none">
                {formatCents(monthSpendCents, { showFraction: false })}
              </div>
              <div className="text-cream/85 mt-2">
                {hasPayments ? `${monthPayments.length} payments this month` : 'No visits billed yet'}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-cream/15">
                <div>
                  <div className="font-display text-2xl font-medium">10%</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/70 mt-1">Service fee</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-medium">$0</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/70 mt-1">Hidden fees</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-medium">{payments.length}</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/70 mt-1">Total receipts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Next charge + payment method */}
          <div className="space-y-6">
            <div className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Billing cycle</div>
              <div className="font-display text-2xl font-medium">Monthly</div>
              <div className="text-sm text-ink/70 mt-1">
                We charge on the 1st for the previous month's confirmed visits.
              </div>
            </div>

            <div className="bg-white border border-ink/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50">Payment method</div>
                <Link href="/client/profile" className="text-xs text-deepteal hover:text-coral">Manage</Link>
              </div>
              <div className="bg-mist/40 rounded-xl p-4 text-sm text-ink/70">
                No payment method on file yet. Add one when you're ready to book your first caregiver.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECEIPTS */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.2s' }}>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Transactions</div>
            <h2 className="font-display text-2xl lg:text-3xl font-medium">Receipts</h2>
          </div>
        </div>

        {hasPayments ? (
          <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
              <div className="col-span-5">Date</div>
              <div className="col-span-4">Caregiver</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            {payments.map((p) => {
              const cnaId = cnaByBooking.get(p.booking_id);
              const cnaName = (cnaId && cnaNames.get(cnaId)) || 'Caregiver';
              const av = avatarClass(cnaName);
              return (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-5 py-4 text-sm border-b border-ink/10 hover:bg-mist/40 transition items-center">
                  <div className="col-span-5">
                    <div className="font-medium">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${av} flex items-center justify-center text-cream text-xs font-medium`}>
                      {initials(cnaName)}
                    </div>
                    <span>{cnaName}</span>
                  </div>
                  <div className="col-span-2 text-right font-mono font-medium">{formatCents(p.amount_cents)}</div>
                  <div className="col-span-1 text-right text-xs text-ink/60 capitalize">{p.status}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">🧾</div>
            <h3 className="font-display text-xl font-medium mb-1">No receipts yet</h3>
            <p className="text-sm text-ink/60 max-w-sm mx-auto">
              After each visit, an itemized receipt appears here. You'll always see exactly what you
              paid and to whom.
            </p>
          </div>
        )}
      </section>

      {/* LTC reimbursement support */}
      <section className="fade-up" style={{ animationDelay: '.3s' }}>
        <div className="bg-gradient-to-br from-butter/20 to-sky/15 border border-teal/20 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start gap-6">
          <div className="text-4xl">📄</div>
          <div className="flex-1">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/60 mb-1">For LTC insurance claims</div>
            <h3 className="font-display text-2xl font-medium mb-2">Auto-generated visit logs</h3>
            <p className="text-sm text-ink/75 leading-relaxed max-w-2xl mb-4">
              Submitting to Genworth, Mutual of Omaha, or John Hancock? We'll generate the visit logs
              and itemized invoices your carrier wants — formatted exactly to their spec. No manual
              paperwork.
            </p>
            <div className="text-xs text-ink/50">
              Available once you have completed visits on record.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
