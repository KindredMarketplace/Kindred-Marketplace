/**
 * /client/profile — the client's CARE PROFILE ("My profile" in the main nav).
 *
 * This is purely the care profile now (who needs care, care types, schedule,
 * budget, insurance, priorities, preferences). Account settings — notifications,
 * privacy, security, family access, payment methods, close account — live on a
 * separate page at /client/account.
 *
 * Widescreen layout (max-w-[1400px]) with a dynamic, blocky editor.
 */

import { redirect } from 'next/navigation';
import { ClientProfileEditor } from '@/components/client/ClientProfileEditor';
import { getViewer } from '@/lib/viewer';

export const dynamic = 'force-dynamic';

export default async function ClientProfilePage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect('/login');

  const [profileRes, taxRes, recipientRes] = await Promise.all([
    supabase
      .from('client_profiles')
      .select('relationship_to_recipient, zip')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('service_taxonomy').select('key, label, category').order('display_order', { ascending: true }),
    supabase
      .from('care_recipients')
      .select(
        'name, date_of_birth, care_types, care_types_other, care_frequency, schedule_detail, hours_per_week, budget_min_cents, budget_max_cents, priorities, payer_type, insurance_detail, mobility_level, living_situation, preferences, notes, bio, fav_foods, fav_movies, fav_shows, fav_music, hobbies'
      )
      .eq('client_id', user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const services = taxRes.data ?? [];
  const recipient = recipientRes.data;

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-10 lg:py-14">
      {/* HEADER */}
      <section className="mb-8 fade-up flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-ink/50 mb-2">My profile</div>
          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight">
            Your <span className="italic font-medium text-gradient">care</span> profile.
          </h1>
          <p className="text-ink/70 mt-2 max-w-2xl">
            The fuller this is, the better we match you. Update anything any time — it&rsquo;s also what
            pre-fills when you post a job.
          </p>
        </div>
      </section>

      <section className="fade-up" style={{ animationDelay: '.05s' }}>
        <ClientProfileEditor
          services={services}
          initial={{
            relationship: profile?.relationship_to_recipient ?? '',
            zip: profile?.zip && profile.zip !== '00000' ? profile.zip : '',
            recipientName: recipient?.name && recipient.name !== 'Care recipient' ? recipient.name : '',
            recipientDob: recipient?.date_of_birth ?? '',
            careTypes: recipient?.care_types ?? [],
            careTypesOther: recipient?.care_types_other ?? '',
            careFrequency: recipient?.care_frequency ?? '',
            scheduleDetail: recipient?.schedule_detail ?? '',
            hoursPerWeek: recipient?.hours_per_week?.toString() ?? '',
            budgetMin: recipient?.budget_min_cents ? Math.round(recipient.budget_min_cents / 100) : 0,
            budgetMax: recipient?.budget_max_cents ? Math.round(recipient.budget_max_cents / 100) : 0,
            priorities: recipient?.priorities ?? [],
            payerType: recipient?.payer_type ?? '',
            insuranceDetail: recipient?.insurance_detail ?? '',
            mobilityLevel: recipient?.mobility_level ?? '',
            livingSituation: recipient?.living_situation ?? '',
            bio: recipient?.bio ?? '',
            favFoods: recipient?.fav_foods ?? [],
            favMovies: recipient?.fav_movies ?? [],
            favShows: recipient?.fav_shows ?? [],
            favMusic: recipient?.fav_music ?? [],
            hobbies: recipient?.hobbies ?? [],
            preferences: recipient?.preferences ?? '',
            notes: recipient?.notes ?? '',
          }}
        />
      </section>
    </main>
  );
}
