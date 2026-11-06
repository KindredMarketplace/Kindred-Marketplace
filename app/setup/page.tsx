/**
 * /setup — the post-signup care-setup flow for clients.
 *
 * Full-screen (no portal chrome) so it feels like a focused onboarding moment.
 * Lives at the top level (not /client/setup) specifically to avoid inheriting
 * the client portal layout's nav/footer.
 *
 * Loads the live service_taxonomy for the care-type picker and pre-fills any
 * data the client already has (so re-running setup from the profile page shows
 * their current answers). The actual UI is <ClientSetupForm/>.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientSetupForm } from '@/components/client/ClientSetupForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set up care — Kindred',
};

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Only clients run this flow. Send other roles to their dashboards.
  const { data: profileRole } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profileRole?.role === 'cna') redirect('/cna/dashboard');
  if (profileRole?.role === 'business') redirect('/');
  if (profileRole?.role === 'admin') redirect('/admin');

  const [taxRes, profileRes, recipientRes] = await Promise.all([
    supabase.from('service_taxonomy').select('key, label, category').order('display_order', { ascending: true }),
    supabase
      .from('client_profiles')
      .select('relationship_to_recipient, zip')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('care_recipients')
      .select('name, date_of_birth, care_types, care_frequency, hours_per_week, budget_min_cents, budget_max_cents, priorities')
      .eq('client_id', user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const services = taxRes.data ?? [];
  const profile = profileRes.data;
  const recipient = recipientRes.data;

  return (
    <ClientSetupForm
      services={services}
      initial={{
        relationship: profile?.relationship_to_recipient ?? undefined,
        zip: profile?.zip && profile.zip !== '00000' ? profile.zip : undefined,
        recipientName: recipient?.name && recipient.name !== 'Care recipient' ? recipient.name : undefined,
        recipientDob: recipient?.date_of_birth ?? undefined,
        careTypes: recipient?.care_types ?? undefined,
        careFrequency: recipient?.care_frequency ?? undefined,
        hoursPerWeek: recipient?.hours_per_week ?? undefined,
        budgetMin: recipient?.budget_min_cents ? Math.round(recipient.budget_min_cents / 100) : undefined,
        budgetMax: recipient?.budget_max_cents ? Math.round(recipient.budget_max_cents / 100) : undefined,
        priorities: recipient?.priorities ?? undefined,
      }}
    />
  );
}
