/**
 * scripts/seed-auth-accounts.ts
 *
 * One-shot script to create:
 *   1. The Kindred admin account (yours)
 *   2. Three demo accounts (client / CNA / business) with realistic profiles
 *
 * SAFETY: This script uses the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
 * Never commit it. Run only locally.
 *
 * Run with:
 *   npx tsx scripts/seed-auth-accounts.ts
 *
 * Idempotent — if an account already exists, the script logs a skip and
 * moves on.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =============================================================================
// Accounts to create
// =============================================================================

type AccountSeed = {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'client' | 'cna' | 'business';
};

const ACCOUNTS: AccountSeed[] = [
  {
    email: 'kindredhhcmarketplace@gmail.com',
    password: 'Admin!Kindred2026',
    full_name: 'Nick (Admin)',
    role: 'admin',
  },
  {
    email: 'demo-client@kindredhhc.com',
    password: 'Demo!Kindred2026',
    full_name: 'Sarah Patterson',
    role: 'client',
  },
  {
    email: 'demo-cna@kindredhhc.com',
    password: 'Demo!Kindred2026',
    full_name: 'Maria Hernandez',
    role: 'cna',
  },
  {
    email: 'demo-business@kindredhhc.com',
    password: 'Demo!Kindred2026',
    full_name: 'David Chen',
    role: 'business',
  },
];

// =============================================================================
// Profile data — what gets written to client_profiles / cna_profiles
// =============================================================================

const CLIENT_PROFILE = {
  name: 'Sarah Patterson',
  zip: '32601',
  street_address: '1247 NW 16th Avenue',
  city: 'Gainesville',
  state: 'FL',
  primary_contact_phone: '352-555-0142',
  relationship_to_recipient: 'parent',
  notes: 'Daughter coordinating care for her 78-year-old mother Helen, who lives with early-stage Alzheimer\u2019s.',
};

const CARE_RECIPIENT = {
  name: 'Helen Patterson',
  date_of_birth: '1947-03-12',
  conditions: ['early_alzheimers', 'mild_mobility_impaired', 'hypertension'],
  allergies: ['penicillin'],
  medications: ['donepezil_5mg', 'lisinopril_10mg'],
  preferences: 'Prefers female caregivers. Loves classical music, especially piano. Most alert in the mornings.',
  routines: 'Morning routine 7\u20139am: breakfast, medications, dressing. Afternoon nap 1\u20132:30pm. Evening wind-down with music.',
  notes: 'Lives in her own home, daughter visits 3x/week. Needs companionship + light housekeeping + medication reminders.',
};

const CNA_PROFILE = {
  display_name: 'Maria',
  last_name: 'Hernandez',
  bio: 'Bilingual CNA with 6 years of experience specializing in dementia care and post-surgical recovery. I treat every client like family \u2014 because someday it could be mine.',
  headline: 'Bilingual dementia & post-surgical care specialist',
  hourly_rate_cents: 2800, // $28/hr
  license_number: 'CNA12345678',
  license_verified_at: new Date().toISOString(),
  license_expires_at: '2028-06-30',
  years_experience: 6,
  languages: ['English', 'Spanish'],
  gender: 'female',
  age_bracket: '30s',
  service_lat: 29.6516,
  service_lng: -82.3248,
  service_zip: '32601',
  service_radius_miles: 15,
  availability_status: 'available' as const,
  tier: 'verified' as const,
  rating_avg: 4.9,
  rating_count: 23,
  completed_shifts_count: 47,
  bg_check_status: 'clear',
  bg_check_completed_at: new Date().toISOString(),
  application_status: 'approved',
};

// Business profile (org) seeding — kept light for now. Schema for B2B
// businesses table lives in 00010_business_portal.sql.

// =============================================================================
// Main
// =============================================================================

async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  // Supabase doesn't expose a direct getByEmail in admin API for v1, so we
  // page through admin users. Small scale OK for now.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return found ? { id: found.id } : null;
}

async function seedAccount(account: AccountSeed): Promise<string> {
  const existing = await findUserByEmail(account.email);

  if (existing) {
    console.log(`\u2713 ${account.email} already exists (${existing.id}) \u2014 skipping create`);

    // Make sure public.users row matches (in case the trigger missed something)
    await supabase
      .from('users')
      .upsert({
        id: existing.id,
        email: account.email,
        full_name: account.full_name,
        role: account.role,
        status: 'active',
      });

    return existing.id;
  }

  // Create via admin API with auto-confirmed email
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.full_name,
      role: account.role,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create ${account.email}: ${error?.message}`);
  }

  // The handle_new_user trigger inserts into public.users with the role from
  // user_metadata. But we also explicitly upsert to be sure status='active'.
  await supabase
    .from('users')
    .upsert({
      id: data.user.id,
      email: account.email,
      full_name: account.full_name,
      role: account.role,
      status: 'active',
    });

  console.log(`\u2713 Created ${account.email} (${data.user.id}) as ${account.role}`);
  return data.user.id;
}

async function seedClientProfile(userId: string) {
  await supabase.from('client_profiles').upsert({
    user_id: userId,
    ...CLIENT_PROFILE,
  });

  // Add care recipient — check first to avoid duplicates
  const { data: existing } = await supabase
    .from('care_recipients')
    .select('id')
    .eq('client_id', userId)
    .eq('name', CARE_RECIPIENT.name)
    .maybeSingle();

  if (!existing) {
    await supabase.from('care_recipients').insert({
      client_id: userId,
      ...CARE_RECIPIENT,
    });
  }

  console.log('   \u21b3 client_profiles + care_recipients seeded');
}

async function seedCnaProfile(userId: string) {
  await supabase.from('cna_profiles').upsert({
    user_id: userId,
    ...CNA_PROFILE,
  });
  console.log('   \u21b3 cna_profiles seeded');
}

async function main() {
  console.log('Seeding Kindred auth accounts\u2026\n');

  for (const account of ACCOUNTS) {
    const userId = await seedAccount(account);

    if (account.role === 'client') await seedClientProfile(userId);
    if (account.role === 'cna') await seedCnaProfile(userId);
    // business profile seeding TBD when the org-onboarding schema is finalized
  }

  console.log('\nDone. Credentials:');
  for (const a of ACCOUNTS) {
    console.log(`  ${a.role.padEnd(9)} \u2192 ${a.email}  /  ${a.password}`);
  }
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
