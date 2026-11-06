/**
 * /business/invoices — Net-30 billing. Ported from
 * Business-Portal/invoices.html. Shell lives in app/business/layout.tsx.
 *
 * Real-data-only: the current-invoice hero + line-item breakdown + history
 * table all come from the real invoices / invoice_line_items tables for this
 * org. Account-standing / payment-method / billing-contact cards render for
 * visual parity (no billing settings wired yet). Empty state when no invoices.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/business';
import { formatCents } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

const INVOICE_STATUS_CHIP: Record<string, string> = {
  draft: 'inv-draft border border-ink/15',
  sent: 'inv-sent border border-sky/30',
  paid: 'inv-paid border border-sage/30',
  overdue: 'inv-overdue border border-coral/30',
  void: 'inv-draft border border-ink/15',
};

function fmtPeriod(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default async function BusinessInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await getBusinessContext();
  if (!ctx?.orgId) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Invoices</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Billing, the <span className="italic font-medium text-gradient">CFO-friendly way.</span>
          </h1>
        </section>
        <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
          <p className="text-sm text-ink/70">Set up your facility to start receiving monthly invoices.</p>
        </div>
      </main>
    );
  }

  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('id, invoice_number, period_start, period_end, subtotal_cents, markup_cents, tax_cents, total_cents, status, due_date, paid_at')
    .eq('org_id', ctx.orgId)
    .order('period_end', { ascending: false });

  const invoices = invoiceData ?? [];
  const current = invoices.find((i) => i.status === 'draft' || i.status === 'sent') ?? invoices[0] ?? null;

  // Line items for the current invoice.
  let lineItems: Array<{ id: string; description: string; hours: number | null; rate_cents: number | null; amount_cents: number }> = [];
  if (current) {
    const { data } = await supabase
      .from('invoice_line_items')
      .select('id, description, hours, rate_cents, amount_cents')
      .eq('invoice_id', current.id)
      .order('amount_cents', { ascending: false });
    lineItems = data ?? [];
  }

  const ytdPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total_cents, 0);

  if (invoices.length === 0) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Invoices</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Billing, the <span className="italic font-medium text-gradient">CFO-friendly way.</span>
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            Monthly invoices, Net-30 terms, paid via ACH. Every line traces back to a signed timesheet
            — no surprises at audit time.
          </p>
        </section>
        <div className="bg-white border border-dashed border-ink/20 rounded-3xl p-12 text-center fade-up" style={{ animationDelay: '.1s' }}>
          <div className="text-3xl mb-3">🧾</div>
          <h2 className="font-display text-2xl font-medium mb-2">No invoices yet</h2>
          <p className="text-sm text-ink/60 max-w-md mx-auto">
            Your first monthly invoice is generated automatically once caregivers complete shifts and
            timesheets are approved. It'll appear here with a full line-item breakdown.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-12">
      {/* HEADER */}
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Invoices</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Billing, the <span className="italic font-medium text-gradient">CFO-friendly way.</span>
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Monthly invoices, Net-30 terms, paid via ACH. Every line traces back to a signed timesheet —
          no surprises at audit time.
        </p>
      </section>

      {/* CURRENT INVOICE HERO */}
      {current && (
        <section className="mb-10 fade-up" style={{ animationDelay: '.05s' }}>
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-gradient-to-br from-deepteal via-teal to-sky text-cream rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cream/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-1">
                      Current period · {fmtPeriod(current.period_start, current.period_end)}
                    </div>
                    <div className="font-display text-2xl">Invoice #{current.invoice_number}</div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono bg-cream/20 text-cream border border-cream/30 capitalize">
                    {current.status}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="text-xs font-mono uppercase tracking-widest text-cream/70 mb-1">Total</div>
                  <div className="font-display text-6xl font-light">{formatCents(current.total_cents)}</div>
                  {current.due_date && (
                    <div className="text-sm text-cream/85 mt-2">
                      Net-30 · Due {new Date(current.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="bg-cream text-deepteal px-5 py-2.5 rounded-full text-sm font-medium hover:bg-cream/90 transition">📄 Preview PDF</button>
                  <button className="border border-cream/30 text-cream px-5 py-2.5 rounded-full text-sm hover:bg-cream/10 transition">📥 Export CSV</button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-3">
              <div className="bg-white border border-ink/10 rounded-2xl p-5">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Account standing</div>
                <div className="font-display text-2xl font-medium text-deepteal">
                  {invoices.some((i) => i.status === 'overdue') ? 'Attention' : 'Good'}
                </div>
                <div className="text-xs text-ink/60 mt-1">
                  {invoices.some((i) => i.status === 'overdue') ? 'Overdue invoice(s) on file' : 'No overdue invoices'}
                </div>
              </div>
              <div className="bg-white border border-ink/10 rounded-2xl p-5">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Payment method</div>
                <div className="text-sm text-ink/70">
                  Set up ACH on the settings page to enable Net-30 auto-pay.
                </div>
                <Link href="/business/settings" className="text-xs text-deepteal hover:text-coral mt-2 inline-block">Manage →</Link>
              </div>
              <div className="bg-white border border-ink/10 rounded-2xl p-5">
                <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">YTD billed (paid)</div>
                <div className="font-display text-2xl font-medium">{formatCents(ytdPaid, { showFraction: false })}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LINE ITEMS */}
      {current && lineItems.length > 0 && (
        <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-1">Current invoice · breakdown</div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium">What you're being billed for</h2>
            </div>
          </div>
          <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
              <div>Description</div>
              <div>Hours</div>
              <div>Rate</div>
              <div className="text-right">Amount</div>
            </div>
            {lineItems.map((li) => (
              <div key={li.id} className="grid grid-cols-[2.5fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 text-sm items-center border-b border-ink/10 hover:bg-mist/40 transition">
                <div className="font-medium">{li.description}</div>
                <div className="font-mono">{li.hours != null ? Number(li.hours).toFixed(1) : '—'}</div>
                <div className="font-mono">{li.rate_cents != null ? `${formatCents(li.rate_cents)}/hr` : '—'}</div>
                <div className="text-right font-display font-medium">{formatCents(li.amount_cents)}</div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_120px] gap-4 px-5 py-4 text-sm items-center bg-gradient-to-r from-deepteal/5 to-teal/5">
              <div className="font-display text-lg">Total due · Net-30</div>
              <div className="text-right font-display text-2xl font-medium">{formatCents(current.total_cents)}</div>
            </div>
          </div>
        </section>
      )}

      {/* INVOICE HISTORY */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.15s' }}>
        <div className="flex items-center gap-6 border-b border-ink/10 mb-5">
          <span className="py-3 text-sm tab-active border-b-2">Invoice history</span>
        </div>

        <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_120px] gap-4 px-5 py-3 text-xs font-mono uppercase tracking-widest text-ink/50 border-b border-ink/10 bg-mist/30">
            <div>Invoice</div>
            <div>Period</div>
            <div>Amount</div>
            <div>Status</div>
            <div></div>
          </div>

          {invoices.map((inv) => (
            <div key={inv.id} className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_120px] gap-4 px-5 py-4 text-sm items-center border-b border-ink/10 last:border-b-0 hover:bg-mist/40 transition">
              <div className="font-mono text-deepteal">{inv.invoice_number}</div>
              <div>{fmtPeriod(inv.period_start, inv.period_end)}</div>
              <div className="font-display font-medium">{formatCents(inv.total_cents)}</div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono capitalize ${INVOICE_STATUS_CHIP[inv.status] ?? 'inv-draft'}`}>
                  {inv.status === 'paid' && inv.paid_at
                    ? `✓ Paid ${new Date(inv.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : inv.status}
                </span>
              </div>
              <button className="text-xs text-deepteal hover:text-coral">View →</button>
            </div>
          ))}

          <div className="px-5 py-3 bg-mist/30 border-t border-ink/10 flex items-center justify-between text-xs">
            <div className="text-ink/60 font-mono">
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} · YTD paid {formatCents(ytdPaid, { showFraction: false })}
            </div>
          </div>
        </div>
      </section>

      {/* HELP CTA */}
      <section className="mb-12 fade-up" style={{ animationDelay: '.2s' }}>
        <div className="bg-creamdark/70 border border-ink/10 rounded-3xl p-6 lg:p-8 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Need to dispute or adjust an invoice?</div>
            <h3 className="font-display text-xl font-medium mb-1">Your account manager handles it directly.</h3>
            <p className="text-sm text-ink/70 leading-relaxed">
              Most invoice questions get resolved same-day. We'll issue a credit memo if there's an
              error — no need to chase accounts payable.
            </p>
          </div>
          <div className="lg:col-span-4 flex gap-2">
            <Link href="/business/messages" className="flex-1 bg-deepteal text-cream text-center px-4 py-3 rounded-full text-sm hover:bg-inkdark transition">Message AM</Link>
            <Link href="/business/help" className="flex-1 border border-ink/15 text-center px-4 py-3 rounded-full text-sm hover:bg-mist transition">Help center</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
