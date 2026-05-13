-- =============================================================================
-- 00004_jobs_bookings_shifts.sql
-- The core marketplace flow:
--   1. Client posts a JOB
--   2. CNA submits an APPLICATION
--   3. Client picks one → creates a BOOKING
--   4. Each visit logged as a SHIFT (also serves EVV when Medicaid is enabled)
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================
create type public.job_status as enum (
  'draft',       -- client filling out, not yet posted
  'open',        -- accepting applications
  'in_review',   -- client reviewing apps
  'filled',      -- accepted a CNA, booking created
  'cancelled',
  'expired'      -- aged out without being filled
);

create type public.job_schedule_type as enum (
  'one_time',    -- single visit
  'recurring',   -- weekly recurring
  'live_in',     -- full-time live-in care
  'on_call'      -- as-needed
);

create type public.job_application_status as enum (
  'submitted',
  'shortlisted',
  'rejected',
  'withdrawn',
  'accepted'     -- this is the one that resulted in a booking
);

create type public.booking_status as enum (
  'scheduled',
  'active',      -- has shifts in progress
  'completed',
  'cancelled',
  'disputed'
);

create type public.shift_status as enum (
  'scheduled',
  'clocked_in',
  'clocked_out',
  'completed',   -- clocked out + payment processed
  'no_show',
  'cancelled',
  'disputed'
);

create type public.payer_type as enum (
  'self_pay',
  'ltc_insurance', -- client pays, we generate reimbursement docs
  'medicaid',      -- v1.5+ — requires EVV + provider enrollment
  'medicare_advantage', -- v2+
  'va',                 -- v2+
  'workers_comp'        -- v2+
);

-- =============================================================================
-- TABLE: jobs
-- =============================================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(user_id) on delete cascade,
  care_recipient_id uuid references public.care_recipients(id) on delete set null,
  title text not null,
  description text not null,
  schedule_type public.job_schedule_type not null default 'recurring',
  hours_per_week int check (hours_per_week > 0),
  -- Budget — typed min/max instead of free-text range (Master Checklist fix)
  budget_min_cents int check (budget_min_cents >= 0),
  budget_max_cents int check (budget_max_cents >= budget_min_cents),
  services_needed text[] not null default array[]::text[],
  -- Location of the care recipient (where the CNA will go)
  zip text not null,
  street_address text,
  city text,
  state text default 'FL',
  location_lat double precision,
  location_lng double precision,
  start_date date,
  end_date date,
  status public.job_status not null default 'draft',
  payer_type public.payer_type not null default 'self_pay',
  -- Whether to broadcast to nearby CNAs on post
  notify_nearby_cnas boolean not null default true,
  posted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_client_idx on public.jobs(client_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_zip_idx on public.jobs(zip);
create index jobs_services_gin_idx on public.jobs using gin (services_needed);
create index jobs_geo_idx on public.jobs
  using gist (ll_to_earth(location_lat, location_lng))
  where location_lat is not null and location_lng is not null;

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

comment on column public.jobs.payer_type is
  'How this job will be paid. Self-pay + LTC are v1. Medicaid is v1.5 (requires EVV).';

-- =============================================================================
-- TABLE: job_applications
-- =============================================================================
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  status public.job_application_status not null default 'submitted',
  message text,
  -- The rate the CNA is asking for this specific job (may differ from default)
  proposed_hourly_rate_cents int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, cna_id) -- one application per CNA per job
);

create index job_applications_job_idx on public.job_applications(job_id);
create index job_applications_cna_idx on public.job_applications(cna_id);
create index job_applications_status_idx on public.job_applications(status);

create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: bookings
-- A confirmed engagement between a client and a CNA. May or may not have an
-- originating job — direct bookings (skip the application flow) are allowed.
-- =============================================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(user_id),
  cna_id uuid not null references public.cna_profiles(user_id),
  job_id uuid references public.jobs(id) on delete set null,
  care_recipient_id uuid references public.care_recipients(id) on delete set null,
  start_date date not null,
  end_date date, -- null = ongoing
  hourly_rate_cents int not null check (hourly_rate_cents > 0),
  status public.booking_status not null default 'scheduled',
  payer_type public.payer_type not null default 'self_pay',
  -- Cancellation policy snapshot — captured at booking time so policy changes
  -- don't retroactively apply
  cancellation_policy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_client_idx on public.bookings(client_id);
create index bookings_cna_idx on public.bookings(cna_id);
create index bookings_status_idx on public.bookings(status);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: shifts
-- One row per actual visit. Clock-in/clock-out + location captured for both:
--   - Trust & safety (proves the CNA was on-site)
--   - EVV compliance when Medicaid is enabled (federally required)
-- =============================================================================
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  clock_in timestamptz,
  clock_out timestamptz,
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_out_lat double precision,
  clock_out_lng double precision,
  hours_worked numeric(5, 2),
  notes text,
  status public.shift_status not null default 'scheduled',
  -- EVV fields — populated when payer_type on booking is 'medicaid'
  evv_submitted_at timestamptz,
  evv_vendor_reference text, -- ID from Tellus/HHAeXchange/Sandata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start),
  check (clock_out is null or clock_in is null or clock_out > clock_in)
);

create index shifts_booking_idx on public.shifts(booking_id);
create index shifts_scheduled_idx on public.shifts(scheduled_start);
create index shifts_status_idx on public.shifts(status);
create index shifts_evv_pending_idx on public.shifts(evv_submitted_at)
  where evv_submitted_at is null and status = 'completed';

create trigger shifts_set_updated_at
  before update on public.shifts
  for each row execute function public.set_updated_at();

comment on table public.shifts is
  'Individual visits. Clock-in/out + GPS doubles as EVV evidence for Medicaid billing.';
comment on column public.shifts.evv_submitted_at is
  'Timestamp when this shift was submitted to the EVV vendor. NULL = not yet submitted.';

-- =============================================================================
-- Auto-calculate hours_worked when clock_out is set
-- =============================================================================
create or replace function public.shifts_calculate_hours()
returns trigger
language plpgsql
as $$
begin
  if new.clock_in is not null and new.clock_out is not null then
    new.hours_worked = round(
      extract(epoch from (new.clock_out - new.clock_in))::numeric / 3600,
      2
    );
  end if;
  return new;
end;
$$;

create trigger shifts_auto_hours
  before insert or update on public.shifts
  for each row execute function public.shifts_calculate_hours();
