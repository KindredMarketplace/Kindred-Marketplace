-- =============================================================================
-- 00008_training_partners.sql
-- The "Become a CNA" liaison model. We don't run training — we connect aspiring
-- CNAs to local certification schools and collect a referral fee.
--
-- Three referral payment models (Open Q5):
--   A) Flat fee per enrollment, school pays us manually
--   B) Student pays Kindred at checkout, we keep cut, remit rest to school
--   C) Affiliate link tracking, school invoices us monthly
--
-- Schema supports all three — the model is per-partner.
-- =============================================================================

create type public.training_partner_status as enum (
  'prospect',     -- not yet contracted
  'active',
  'paused',
  'archived'
);

create type public.referral_payment_model as enum (
  'flat_fee',     -- model A
  'kindred_checkout', -- model B
  'affiliate'     -- model C
);

create type public.training_referral_status as enum (
  'referred',     -- user clicked through / showed interest
  'contacted',    -- school confirmed contact
  'enrolled',     -- school confirmed enrollment
  'completed',    -- student finished cert
  'paid',         -- we received our cut
  'cancelled',    -- student dropped out
  'no_show'
);

-- =============================================================================
-- TABLE: training_partners
-- =============================================================================
create table public.training_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null, -- url-safe — used in /become-a-cna/[slug]
  description text,
  logo_url text,
  hero_image_url text,
  -- Contact info
  contact_name text,
  contact_email text,
  contact_phone text,
  website_url text,
  -- Location
  street_address text,
  city text,
  state text default 'FL',
  zip text,
  lat double precision,
  lng double precision,
  -- Program details
  program_length_weeks int,
  tuition_cents int,
  payment_plans_available boolean default false,
  pell_eligible boolean default false,
  evening_cohorts boolean default false,
  weekend_cohorts boolean default false,
  -- Calendar / scheduling integration
  calendar_provider text, -- 'calendly' | 'acuity' | 'custom_api' | 'manual'
  calendar_api_url text,
  -- Referral terms
  payment_model public.referral_payment_model not null default 'flat_fee',
  referral_fee_cents int, -- for flat_fee
  referral_pct numeric(5, 4), -- for kindred_checkout or affiliate
  status public.training_partner_status not null default 'prospect',
  contract_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_partners_status_idx on public.training_partners(status);
create index training_partners_geo_idx on public.training_partners
  using gist (ll_to_earth(lat, lng))
  where lat is not null and lng is not null;

create trigger training_partners_set_updated_at
  before update on public.training_partners
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: training_partner_cohorts
-- Specific session/cohort start dates per partner. Powers the booking flow.
-- =============================================================================
create table public.training_partner_cohorts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.training_partners(id) on delete cascade,
  start_date date not null,
  end_date date,
  schedule_label text, -- "Mon/Wed/Fri 9a-12p" or "Evenings"
  seats_total int,
  seats_remaining int,
  enrollment_deadline date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index training_partner_cohorts_partner_idx on public.training_partner_cohorts(partner_id);
create index training_partner_cohorts_active_idx on public.training_partner_cohorts(start_date)
  where is_active = true;

-- =============================================================================
-- TABLE: training_referrals
-- Tracks every user we sent to a training partner.
-- =============================================================================
create table public.training_referrals (
  id uuid primary key default gen_random_uuid(),
  -- Nullable because someone might fill out the "find me a school" form without
  -- a Kindred account yet (lead capture).
  user_id uuid references public.users(id) on delete set null,
  partner_id uuid not null references public.training_partners(id),
  cohort_id uuid references public.training_partner_cohorts(id),
  -- Lead details captured even without an account
  lead_email text,
  lead_phone text,
  lead_name text,
  lead_zip text,
  status public.training_referral_status not null default 'referred',
  referred_at timestamptz not null default now(),
  enrolled_at timestamptz,
  completed_at timestamptz,
  paid_at timestamptz,
  referral_fee_cents int,
  -- Stripe payout reference if model B
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_referrals_user_idx on public.training_referrals(user_id);
create index training_referrals_partner_idx on public.training_referrals(partner_id);
create index training_referrals_status_idx on public.training_referrals(status);

create trigger training_referrals_set_updated_at
  before update on public.training_referrals
  for each row execute function public.set_updated_at();

comment on table public.training_referrals is
  'One row per lead we send to a school. Drives "Become a CNA" referral revenue.';
