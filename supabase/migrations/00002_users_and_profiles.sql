-- =============================================================================
-- 00002_users_and_profiles.sql
-- Core identity: users (mirror of auth.users), client profiles, CNA profiles,
-- and care recipient records.
--
-- Note: Supabase Auth manages `auth.users` automatically. We mirror selected
-- fields into `public.users` so we can foreign-key against it and add app-level
-- columns (role, status, etc.). A trigger keeps them in sync on signup.
-- =============================================================================

-- =============================================================================
-- ENUM: user role
-- =============================================================================
create type public.user_role as enum (
  'client',     -- families / care recipients
  'cna',        -- caregivers
  'business',   -- B2B (facilities) — schema reserved, UI deferred
  'admin'       -- Kindred staff
);

create type public.user_status as enum (
  'pending',    -- signed up, not yet verified
  'active',
  'suspended',
  'deleted'
);

-- =============================================================================
-- TABLE: users
-- One row per login. References auth.users(id).
-- =============================================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text,
  role public.user_role not null default 'client',
  status public.user_status not null default 'pending',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_role_idx on public.users(role);
create index users_email_idx on public.users(email);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

comment on table public.users is
  'Application-level mirror of auth.users. Trigger handle_new_user() inserts here on signup.';

-- =============================================================================
-- TRIGGER: auto-create public.users row on auth signup
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- TABLE: client_profiles
-- Family/buyer details. The person paying — often the adult child of the
-- actual care recipient.
-- =============================================================================
create table public.client_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  name text not null,
  zip text not null,
  street_address text,
  city text,
  state text default 'FL',
  primary_contact_phone text,
  billing_address text,
  -- Relationship to care recipient (self, parent, spouse, etc.)
  relationship_to_recipient text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_profiles_zip_idx on public.client_profiles(zip);

create trigger client_profiles_set_updated_at
  before update on public.client_profiles
  for each row execute function public.set_updated_at();

comment on table public.client_profiles is
  'Buyer / family member profiles. Usually adult children of the care recipient.';

-- =============================================================================
-- TABLE: care_recipients
-- The actual person being cared for. Often distinct from the client (e.g.
-- daughter is client, mom is care recipient). One client can have multiple.
-- =============================================================================
create table public.care_recipients (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(user_id) on delete cascade,
  name text not null,
  date_of_birth date,
  -- PHI fields — kept here for now; when HIPAA tier is enabled these should
  -- be encrypted at the column level via pgcrypto or moved to a separate
  -- encrypted-at-rest store.
  conditions text[] default array[]::text[],   -- ['dementia', 'mobility_impaired', ...]
  allergies text[] default array[]::text[],
  medications text[] default array[]::text[],
  preferences text,
  routines text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index care_recipients_client_idx on public.care_recipients(client_id);

create trigger care_recipients_set_updated_at
  before update on public.care_recipients
  for each row execute function public.set_updated_at();

comment on table public.care_recipients is
  'PHI lives here — conditions, meds, allergies. Encrypt at column level when HIPAA tier is enabled.';

-- =============================================================================
-- TABLE: cna_profiles
-- Public-facing caregiver profiles.
-- =============================================================================
create type public.cna_availability_status as enum (
  'available',     -- actively taking jobs
  'fully_booked',  -- visible but not accepting new clients
  'on_break',      -- temporarily inactive
  'inactive'
);

create type public.cna_tier as enum (
  'new',           -- new to platform, base rate, base visibility
  'verified',      -- BG check complete + 1 completed job
  'top_rated'      -- 10+ five-star shifts (see Apply Now tier copy)
);

create table public.cna_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  -- last name shown only to logged-in users (Care.com pattern — see Open Q)
  last_name text,
  photo_url text,
  bio text,
  headline text, -- short tagline shown on cards
  hourly_rate_cents int check (hourly_rate_cents >= 0),
  -- FL CNA license number — verified against FL DOH MQA Provider Search.
  license_number text,
  license_verified_at timestamptz,
  license_expires_at date,
  years_experience int check (years_experience >= 0),
  languages text[] default array['English']::text[],
  gender text,
  age_bracket text, -- '20s'|'30s'|'40s'|'50s'|'60s'|'70s' — bucketed for privacy
  -- Service location anchor — for matching + distance calculation
  service_lat double precision,
  service_lng double precision,
  service_zip text,
  service_radius_miles int default 10 check (service_radius_miles between 1 and 100),
  availability_status public.cna_availability_status not null default 'available',
  tier public.cna_tier not null default 'new',
  -- Aggregates updated by triggers when reviews land
  rating_avg numeric(3, 2) default 0 check (rating_avg between 0 and 5),
  rating_count int not null default 0,
  completed_shifts_count int not null default 0,
  -- Stripe Connect account id for payouts
  stripe_account_id text unique,
  stripe_onboarding_complete boolean not null default false,
  -- Background check status — populated by Checkr webhook
  bg_check_status text default 'not_started', -- 'not_started'|'pending'|'clear'|'consider'|'expired'
  bg_check_completed_at timestamptz,
  -- Application status — separate from user status; tracks the multi-step apply flow
  application_status text default 'incomplete', -- 'incomplete'|'submitted'|'under_review'|'approved'|'rejected'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cna_profiles_zip_idx on public.cna_profiles(service_zip);
create index cna_profiles_tier_idx on public.cna_profiles(tier);
create index cna_profiles_status_idx on public.cna_profiles(availability_status);
create index cna_profiles_rating_idx on public.cna_profiles(rating_avg desc);
-- Geo index — speeds up earth_distance lookups
create index cna_profiles_geo_idx on public.cna_profiles
  using gist (ll_to_earth(service_lat, service_lng))
  where service_lat is not null and service_lng is not null;
-- Trigram index on bio for fuzzy search
create index cna_profiles_bio_trgm_idx on public.cna_profiles using gin (bio gin_trgm_ops);

create trigger cna_profiles_set_updated_at
  before update on public.cna_profiles
  for each row execute function public.set_updated_at();

comment on table public.cna_profiles is
  'Public CNA profiles. Hide last_name + exact contact info from logged-out users (Care.com pattern).';
comment on column public.cna_profiles.tier is
  'Drives visibility + commission rate. See Open Q2 — tiered fee structure.';
