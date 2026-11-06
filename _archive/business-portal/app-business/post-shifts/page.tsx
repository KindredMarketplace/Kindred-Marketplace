/**
 * /business/post-shifts — bulk shift posting. Ported from
 * Business-Portal/post-shifts.html. Shell lives in app/business/layout.tsx.
 *
 * Working form: loads this facility's real shift_templates, then renders the
 * <PostShiftsForm/> client builder which inserts real business_shifts rows via
 * the postShiftsAction server action. If the user isn't linked to an org, we
 * show a setup nudge.
 */

import Link from 'next/link';
import { getBusinessContext } from '@/lib/business';
import { createClient } from '@/lib/supabase/server';
import { PostShiftsForm, type ShiftTemplate } from '@/components/business/PostShiftsForm';

export const dynamic = 'force-dynamic';

/** Next Monday and the Sunday after it, as YYYY-MM-DD. */
function nextWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const daysUntilMon = ((8 - day) % 7) || 7;
  const start = new Date(now);
  start.setDate(now.getDate() + daysUntilMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default async function BusinessPostShiftsPage() {
  const ctx = await getBusinessContext();

  if (!ctx?.orgId) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
        <section className="mb-8 fade-up">
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Post shifts</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Fill <span className="italic font-medium text-gradient">your coverage gaps.</span>
          </h1>
        </section>
        <section className="fade-up" style={{ animationDelay: '.1s' }}>
          <div className="rounded-3xl border-2 border-sage bg-sage/10 p-10 text-center">
            <div className="text-3xl mb-3">🏢</div>
            <h2 className="font-display text-2xl font-medium mb-2">Set up your facility first</h2>
            <p className="text-sm text-ink/70 max-w-md mx-auto mb-5">
              Before you can post shifts, we need your facility details and compliance docs on file.
            </p>
            <Link href="/business/settings" className="inline-block bg-deepteal text-cream px-5 py-2.5 rounded-full text-sm hover:bg-inkdark transition">
              Start facility setup →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: tpls } = await supabase
    .from('shift_templates')
    .select('id, name, start_time, end_time, pay_rate_cents, bill_rate_cents, services_required')
    .eq('org_id', ctx.orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  const templates: ShiftTemplate[] = (tpls ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    start_time: t.start_time,
    end_time: t.end_time,
    pay_rate_cents: t.pay_rate_cents,
    bill_rate_cents: t.bill_rate_cents,
    services_required: t.services_required ?? [],
  }));

  const { start, end } = nextWeekRange();

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-10 lg:py-14">
      <section className="mb-8 fade-up">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">Post shifts</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Fill <span className="italic font-medium text-gradient">your coverage gaps.</span>
        </h1>
        <p className="text-ink/70 mt-2 max-w-2xl">
          Most facilities post 30–50 shifts a week. We made that fast — pick a template, set a date
          range, done.
        </p>
      </section>

      <PostShiftsForm templates={templates} defaultStartDate={start} defaultEndDate={end} />
    </main>
  );
}
