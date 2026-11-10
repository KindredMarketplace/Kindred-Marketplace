/**
 * /client/post-job — post a job. Ported from Client-Portal/post-job.html.
 * Shell lives in app/client/layout.tsx.
 *
 * This is a REAL working form: it loads the live service_taxonomy, pre-fills the
 * client's care recipient + ZIP, and inserts a real row into `jobs` via the
 * postJobAction server action. The interactive form is <PostJobForm/>.
 */

import { redirect } from 'next/navigation';
import { PostJobForm } from '@/components/client/PostJobForm';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function ClientPostJobPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [taxRes, profileRes, recipientsRes] = await Promise.all([
    supabase.from('service_taxonomy').select('key, label, category').order('display_order', { ascending: true }),
    supabase.from('client_profiles').select('zip').eq('user_id', user.id).maybeSingle(),
    supabase.from('care_recipients').select('id, name').eq('client_id', user.id).limit(1),
  ]);

  const services = taxRes.data ?? [];
  const defaultZip = profileRes.data?.zip ?? '';
  const recipient = recipientsRes.data?.[0] ?? null;

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-10 fade-up text-center">
        <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-3">Post a job</div>
        <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
          Tell us what you need — <br />
          <span className="italic font-medium text-gradient">we'll surface caregivers who fit.</span>
        </h1>
        <p className="text-ink/70 mt-3 max-w-xl mx-auto">
          CNAs in your area will see this and apply. You pick the one who feels right.
        </p>
      </section>

      {/* SECTION JUMP BAR — honest one-page form, three labeled sections */}
      <section className="mb-10 fade-up" style={{ animationDelay: '.1s' }}>
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          <span className="font-mono uppercase tracking-widest text-ink/50">Sections:</span>
          <span className="px-3 py-1.5 rounded-full bg-deepteal text-cream font-medium">The basics</span>
          <span className="text-ink/30">·</span>
          <span className="px-3 py-1.5 rounded-full bg-mist text-ink/70">Schedule</span>
          <span className="text-ink/30">·</span>
          <span className="px-3 py-1.5 rounded-full bg-mist text-ink/70">Pay &amp; post</span>
        </div>
        <p className="text-center text-xs text-ink/50 mt-3 font-mono">All on one page — scroll through and post when you’re ready.</p>
      </section>

      <PostJobForm
        services={services}
        defaultZip={defaultZip}
        recipientId={recipient?.id ?? null}
        recipientName={recipient?.name ?? null}
      />
    </main>
  );
}
