-- =============================================================================
-- 00003_cna_supporting_tables.sql
-- Services offered, verifications (BG check, CPR, etc.), service area polygons,
-- and recurring availability windows.
-- =============================================================================

-- =============================================================================
-- TABLE: service_taxonomy
-- The single source of truth for service tags. Same list is used by:
--   - CNAs to list what they do
--   - Clients to filter Browse + tag job posts
--   - Businesses to specify shift requirements
--
-- Seeded in supabase/seed/01_service_taxonomy.sql with the actual service list.
-- =============================================================================
create table public.service_taxonomy (
  key text primary key, -- 'bathing', 'dementia_care', etc.
  label text not null,  -- 'Bathing & Hygiene'
  category text not null, -- 'personal_care' | 'medical' | 'household' | 'specialty'
  description text,
  requires_certification boolean not null default false,
  display_order int not null default 0
);

create index service_taxonomy_category_idx on public.service_taxonomy(category);

comment on table public.service_taxonomy is
  'Master list of service tags. Used by CNAs, clients, and businesses. Seeded from /supabase/seed.';

-- =============================================================================
-- TABLE: cna_services
-- Many-to-many between CNAs and services they offer.
-- =============================================================================
create table public.cna_services (
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  service_key text not null references public.service_taxonomy(key) on delete restrict,
  -- Self-reported years of experience with this specific service
  years_experience int check (years_experience >= 0),
  primary key (cna_id, service_key)
);

create index cna_services_service_idx on public.cna_services(service_key);

-- =============================================================================
-- TABLE: cna_verifications
-- Badges shown on profiles: BG check, CPR, license, insurance, etc.
-- Each row = one credential. Most have an expiration we should flag in advance.
-- =============================================================================
create type public.verification_type as enum (
  'l2bg',          -- Level 2 background check
  'cpr',           -- CPR/AED certification
  'license',       -- FL CNA license
  'insurance',     -- Personal liability/malpractice
  'tb_test',       -- TB clearance (required by most facilities)
  'covid_vax',     -- COVID vaccination
  'first_aid',
  'dementia_cert', -- specialty cert
  'hospice_cert',
  'driver_license',
  'auto_insurance'
);

create type public.verification_status as enum (
  'pending',
  'verified',
  'rejected',
  'expired'
);

create table public.cna_verifications (
  id uuid primary key default gen_random_uuid(),
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  type public.verification_type not null,
  status public.verification_status not null default 'pending',
  -- External reference (e.g. Checkr report ID) if applicable
  external_id text,
  -- Document file in Supabase Storage backing this verification
  document_id uuid, -- FK added in 00009_documents.sql
  verified_at timestamptz,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cna_id, type) -- one of each type per CNA; re-verifying updates the row
);

create index cna_verifications_cna_idx on public.cna_verifications(cna_id);
create index cna_verifications_expiring_idx on public.cna_verifications(expires_at)
  where status = 'verified' and expires_at is not null;

create trigger cna_verifications_set_updated_at
  before update on public.cna_verifications
  for each row execute function public.set_updated_at();

comment on table public.cna_verifications is
  'One row per credential type per CNA. Background check, CPR, license, etc. Drives badge display.';

-- =============================================================================
-- TABLE: cna_service_areas
-- Optional polygon-based service area. CNAs without a polygon fall back to
-- the radius set on cna_profiles.service_radius_miles.
--
-- polygon_geojson stores the raw GeoJSON polygon drawn in the Mapbox UI.
-- We don't query against it directly in v1 — radius-based matching is enough
-- to start. v2: index with PostGIS for proper polygon containment queries.
-- =============================================================================
create table public.cna_service_areas (
  id uuid primary key default gen_random_uuid(),
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  polygon_geojson jsonb,
  zip_codes text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cna_service_areas_cna_idx on public.cna_service_areas(cna_id);
create index cna_service_areas_zip_gin_idx on public.cna_service_areas using gin (zip_codes);

create trigger cna_service_areas_set_updated_at
  before update on public.cna_service_areas
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: cna_availability
-- Recurring weekly availability. Day-of-week + start/end time.
-- For one-off blocked dates use cna_availability_overrides below.
-- =============================================================================
create type public.day_of_week as enum (
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
);

create table public.cna_availability (
  id uuid primary key default gen_random_uuid(),
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  day_of_week public.day_of_week not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index cna_availability_cna_idx on public.cna_availability(cna_id);

-- =============================================================================
-- TABLE: cna_availability_overrides
-- Specific date ranges where the CNA's availability differs from their recurring
-- schedule. Can be a block-off (PTO) or an extra-available window.
-- =============================================================================
create table public.cna_availability_overrides (
  id uuid primary key default gen_random_uuid(),
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_available boolean not null, -- false = blocked, true = extra availability
  reason text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index cna_availability_overrides_cna_idx on public.cna_availability_overrides(cna_id);
create index cna_availability_overrides_range_idx on public.cna_availability_overrides(start_at, end_at);
