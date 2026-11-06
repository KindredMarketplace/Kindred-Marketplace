-- =============================================================================
-- 00024 — Platform model reset (Oct–Nov 2026)
--
--   Kindred is a platform, not an employer. Revenue = paid ACCESS
--   (startup fee + monthly membership), never a cut of care fees.
--   The product = the Kindred Standard (vetting bar).
--   The storefront = a LOCKED PREVIEW whose redaction happens HERE, in the
--   database, not with CSS blur.
--
--   Adds: access_plans, platform_settings, memberships, cna_profiles.experience_hours
--   Helpers (kindred_internal): is_member, meets_kindred_standard, is_listed,
--            is_connected, grant_founding_if_available
--   Public RPCs: browse_caregivers(), browse_open_jobs(), my_access()
--   Guards: caregivers can't approve themselves, set their own hours, or
--           verify their own documents (BEFORE triggers; admin/service only)
--   RLS: cna_profiles + cna_verifications readable by self/admin ONLY; every
--        cross-user read goes through security-definer functions that return
--        a fixed set of safe columns;
--        open jobs readable in full only by listed caregivers;
--        job applications require a listed caregiver;
--        families must be members to START a message thread.
-- =============================================================================

-- ---------------------------------------------------------------- types
do $$ begin
  create type public.membership_status as enum ('none', 'active', 'comped', 'past_due', 'canceled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- access_plans
create table if not exists public.access_plans (
  key text primary key,
  role public.user_role not null,
  label text not null,
  startup_fee_cents integer not null check (startup_fee_cents >= 0),
  monthly_cents integer not null check (monthly_cents >= 0),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.access_plans is
  'Kindred membership prices. Edit here, no deploy needed. Money is for ACCESS only, never care.';

insert into public.access_plans (key, role, label, startup_fee_cents, monthly_cents, sort) values
  ('caregiver_standard', 'cna',    'Caregiver membership', 10000, 2000, 1),
  ('family_standard',    'client', 'Family membership',    10000, 2000, 2)
on conflict (key) do nothing;

alter table public.access_plans enable row level security;
drop policy if exists access_plans_select_active on public.access_plans;
create policy access_plans_select_active on public.access_plans
  for select to anon, authenticated using (active or kindred_internal.is_admin());
drop policy if exists access_plans_admin_write on public.access_plans;
create policy access_plans_admin_write on public.access_plans
  for all to authenticated using (kindred_internal.is_admin()) with check (kindred_internal.is_admin());

-- ---------------------------------------------------------------- platform_settings
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (key, value) values
  ('founding_caregiver_cap', '25'::jsonb),
  ('founding_term_months', '12'::jsonb),
  ('kindred_standard_min_hours', '1500'::jsonb)
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;
drop policy if exists platform_settings_select on public.platform_settings;
create policy platform_settings_select on public.platform_settings
  for select to anon, authenticated using (true);
drop policy if exists platform_settings_admin_write on public.platform_settings;
create policy platform_settings_admin_write on public.platform_settings
  for all to authenticated using (kindred_internal.is_admin()) with check (kindred_internal.is_admin());

-- ---------------------------------------------------------------- memberships
create table if not exists public.memberships (
  user_id uuid primary key references public.users(id) on delete cascade,
  role public.user_role not null,
  status public.membership_status not null default 'none',
  plan_key text references public.access_plans(key),
  founding boolean not null default false,
  startup_fee_waived boolean not null default false,
  startup_fee_paid_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  comp_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists memberships_founding_idx on public.memberships (role) where founding;
comment on table public.memberships is
  'Paid access to Kindred. Written only by the service role (Stripe webhook) or admins.';

drop trigger if exists memberships_set_updated_at on public.memberships;
create trigger memberships_set_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();
drop trigger if exists access_plans_set_updated_at on public.access_plans;
create trigger access_plans_set_updated_at before update on public.access_plans
  for each row execute function public.set_updated_at();

alter table public.memberships enable row level security;
drop policy if exists memberships_select_self on public.memberships;
create policy memberships_select_self on public.memberships
  for select to authenticated using (user_id = auth.uid() or kindred_internal.is_admin());
drop policy if exists memberships_admin_write on public.memberships;
create policy memberships_admin_write on public.memberships
  for all to authenticated using (kindred_internal.is_admin()) with check (kindred_internal.is_admin());

-- ---------------------------------------------------------------- experience hours
alter table public.cna_profiles
  add column if not exists experience_hours integer check (experience_hours is null or experience_hours >= 0);

-- ---------------------------------------------------------------- helpers
grant usage on schema kindred_internal to anon, authenticated;

create or replace function kindred_internal.is_member(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = uid
      and m.status in ('active', 'comped')
      and (m.current_period_end is null or m.current_period_end > now())
  );
$$;

create or replace function kindred_internal.meets_kindred_standard(cna uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.cna_profiles p
    where p.user_id = cna
      and p.application_status = 'approved'
      and coalesce(p.experience_hours, 0) >= coalesce(
            (select (s.value #>> '{}')::int from public.platform_settings s
              where s.key = 'kindred_standard_min_hours'), 1500)
  )
  and (
    select count(distinct v.type) from public.cna_verifications v
    where v.cna_id = cna
      and v.status = 'verified'
      and v.type in ('l2bg', 'identity', 'insurance')
      and (v.expires_at is null or v.expires_at >= current_date)
  ) = 3;
$$;

create or replace function kindred_internal.is_listed(cna uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select kindred_internal.meets_kindred_standard(cna) and kindred_internal.is_member(cna);
$$;

-- Two people are "connected" once there is a live thread or a job application between them.
create or replace function kindred_internal.is_connected(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select a is not null and b is not null and (
    exists (select 1 from public.message_threads t
             where ((t.participant_a = a and t.participant_b = b)
                 or (t.participant_a = b and t.participant_b = a))
               and t.status in ('pending_request', 'accepted'))
    or exists (select 1 from public.job_applications ja join public.jobs j on j.id = ja.job_id
                where ((ja.cna_id = a and j.client_id = b) or (ja.cna_id = b and j.client_id = a))
                  and ja.status not in ('withdrawn', 'rejected'))
  );
  -- Bookings are deliberately NOT a connection: either party can insert one.
$$;

revoke all on function kindred_internal.is_member(uuid) from public;
revoke all on function kindred_internal.meets_kindred_standard(uuid) from public;
revoke all on function kindred_internal.is_listed(uuid) from public;
revoke all on function kindred_internal.is_connected(uuid, uuid) from public;
grant execute on function kindred_internal.is_member(uuid) to anon, authenticated;
grant execute on function kindred_internal.meets_kindred_standard(uuid) to anon, authenticated;
grant execute on function kindred_internal.is_listed(uuid) to anon, authenticated;
grant execute on function kindred_internal.is_connected(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------- write guards
-- The existing self-write policies (cna_profiles_insert_self / _update_self,
-- cna_verifications_write_self) let a caregiver write ANY column of their own
-- rows. These BEFORE triggers pin the columns that only Kindred may set.
-- "Privileged" = an admin, or a server-side role (service_role / postgres).
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
create or replace function kindred_internal.is_privileged_writer()
returns boolean language sql stable set search_path = '' as $$
  select current_user not in ('anon', 'authenticated') or coalesce(kindred_internal.is_admin(), false);
$$;
grant execute on function kindred_internal.is_privileged_writer() to anon, authenticated;

create or replace function kindred_internal.guard_cna_profile_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.application_status is null or new.application_status not in ('incomplete', 'submitted') then
      new.application_status := 'incomplete';
    end if;
    new.experience_hours := null;
    new.application_notes := null;
    new.application_decline_reason := null;
    new.interview_at := null;
    new.tier := 'new';
    new.rating_avg := 0;
    new.rating_count := 0;
    new.completed_shifts_count := 0;
    new.bg_check_status := null;
    new.bg_check_completed_at := null;
    new.license_verified_at := null;
    new.stripe_account_id := null;
    new.stripe_onboarding_complete := false;
    return new;
  end if;

  -- UPDATE: a caregiver may only move their own draft forward to 'submitted'.
  if not (coalesce(old.application_status, 'incomplete') in ('incomplete', 'submitted')
          and new.application_status in ('incomplete', 'submitted')) then
    new.application_status := old.application_status;
  end if;
  new.experience_hours := old.experience_hours;
  new.application_notes := old.application_notes;
  new.application_decline_reason := old.application_decline_reason;
  new.interview_at := old.interview_at;
  new.tier := old.tier;
  new.rating_avg := old.rating_avg;
  new.rating_count := old.rating_count;
  new.completed_shifts_count := old.completed_shifts_count;
  new.bg_check_status := old.bg_check_status;
  new.bg_check_completed_at := old.bg_check_completed_at;
  new.license_verified_at := old.license_verified_at;
  new.stripe_account_id := old.stripe_account_id;
  new.stripe_onboarding_complete := old.stripe_onboarding_complete;
  return new;
end;
$$;

drop trigger if exists cna_profiles_guard_write on public.cna_profiles;
create trigger cna_profiles_guard_write
  before insert or update on public.cna_profiles
  for each row execute function kindred_internal.guard_cna_profile_write();

-- Caregivers can upload / resubmit documents, but only Kindred marks them verified.
create or replace function kindred_internal.guard_cna_verification_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;
  new.status := 'pending';
  new.verified_at := null;
  return new;
end;
$$;

drop trigger if exists cna_verifications_guard_write on public.cna_verifications;
create trigger cna_verifications_guard_write
  before insert or update on public.cna_verifications
  for each row execute function kindred_internal.guard_cna_verification_write();

-- Applications create a "connection", so who/what an application is about
-- can never be changed after the fact (only its status / message).
create or replace function kindred_internal.guard_job_application_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;
  new.job_id := old.job_id;
  new.cna_id := old.cna_id;
  return new;
end;
$$;

drop trigger if exists job_applications_guard_write on public.job_applications;
create trigger job_applications_guard_write
  before update on public.job_applications
  for each row execute function kindred_internal.guard_job_application_write();

-- ---------------------------------------------------------------- founding caregivers
-- First N approved caregivers get a free year, startup fee waived.
-- Advisory lock serialises concurrent approvals so the cap can't be overrun.
create or replace function kindred_internal.grant_founding_if_available(cna uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  cap int;
  term_months int;
  used int;
begin
  perform pg_advisory_xact_lock(hashtext('kindred_founding_caregivers'));

  if exists (select 1 from public.memberships m where m.user_id = cna) then
    return false; -- already has a membership row; never overwrite a paid one
  end if;

  select coalesce((value #>> '{}')::int, 25) into cap
    from public.platform_settings where key = 'founding_caregiver_cap';
  select coalesce((value #>> '{}')::int, 12) into term_months
    from public.platform_settings where key = 'founding_term_months';
  cap := coalesce(cap, 25);
  term_months := coalesce(term_months, 12);

  select count(*) into used from public.memberships where founding and role = 'cna';
  if used >= cap then
    return false;
  end if;

  insert into public.memberships
    (user_id, role, status, plan_key, founding, startup_fee_waived, current_period_end, comp_reason)
  values
    (cna, 'cna', 'comped', 'caregiver_standard', true, true,
     now() + make_interval(months => term_months), 'Founding caregiver');
  return true;
end;
$$;
revoke all on function kindred_internal.grant_founding_if_available(uuid) from public, anon, authenticated;

create or replace function kindred_internal.on_cna_approved()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.application_status = 'approved'
     and (tg_op = 'INSERT' or old.application_status is distinct from 'approved') then
    perform kindred_internal.grant_founding_if_available(new.user_id);
  end if;
  return new;
end;
$$;
revoke all on function kindred_internal.on_cna_approved() from public, anon, authenticated;

drop trigger if exists cna_profiles_grant_founding on public.cna_profiles;
create trigger cna_profiles_grant_founding
  after insert or update of application_status on public.cna_profiles
  for each row execute function kindred_internal.on_cna_approved();

-- Backfill: anyone already approved gets considered (oldest approval first).
do $$
declare r record;
begin
  for r in select user_id from public.cna_profiles
           where application_status = 'approved' order by created_at loop
    perform kindred_internal.grant_founding_if_available(r.user_id);
  end loop;
end $$;

-- ---------------------------------------------------------------- preview pseudonyms
-- A per-database random salt, unreadable by API users, so a locked-preview id
-- can't be matched back to a real user id by recomputing the hash.
create table if not exists kindred_internal.secrets (key text primary key, value text not null);
insert into kindred_internal.secrets (key, value)
  values ('preview_salt', md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text))
  on conflict (key) do nothing;
revoke all on kindred_internal.secrets from public, anon, authenticated;

create or replace function kindred_internal.preview_id(uid uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select md5((select value from kindred_internal.secrets where key = 'preview_salt') || ':' || uid::text)::uuid;
$$;
revoke all on function kindred_internal.preview_id(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS tightening
-- These caregiver side-tables were readable by anyone (`using (true)`), which
-- exposed real caregiver ids and let the locked preview be de-anonymised.
-- Their data reaches families through browse_caregivers() instead.
drop policy if exists cna_services_select_public on public.cna_services;
drop policy if exists cna_services_select_scoped on public.cna_services;
create policy cna_services_select_scoped on public.cna_services
  for select to authenticated using (cna_id = auth.uid() or kindred_internal.is_admin());
drop policy if exists cna_availability_select_public on public.cna_availability;
drop policy if exists cna_availability_select_scoped on public.cna_availability;
create policy cna_availability_select_scoped on public.cna_availability
  for select to authenticated using (cna_id = auth.uid() or kindred_internal.is_admin());
drop policy if exists cna_availability_overrides_select_public on public.cna_availability_overrides;
drop policy if exists cna_availability_overrides_select_scoped on public.cna_availability_overrides;
create policy cna_availability_overrides_select_scoped on public.cna_availability_overrides
  for select to authenticated using (cna_id = auth.uid() or kindred_internal.is_admin());
drop policy if exists cna_service_areas_select_public on public.cna_service_areas;
drop policy if exists cna_service_areas_select_scoped on public.cna_service_areas;
create policy cna_service_areas_select_scoped on public.cna_service_areas
  for select to authenticated using (cna_id = auth.uid() or kindred_internal.is_admin());
-- Visible reviews were public with reviewer/reviewee ids. Reviews UI comes in
-- Phase 5 through a function; until then, parties + admins only.
drop policy if exists reviews_select_public_visible on public.reviews;

-- Only families post jobs (a caregiver posting a "bait job" could harvest
-- other caregivers' details from their applications).
drop policy if exists jobs_insert_self on public.jobs;
create policy jobs_insert_self on public.jobs
  for insert with check (client_id = auth.uid() and kindred_internal.current_user_role() = 'client');

-- cna_profiles: was `using (true)` for everyone, which exposed application
-- answers, notes, license numbers and resumes to anonymous visitors.
drop policy if exists cna_profiles_select_public on public.cna_profiles;
drop policy if exists cna_profiles_select_scoped on public.cna_profiles;
-- Self only (admins keep their existing "Admins can read all cna_profiles").
-- Everyone else reads caregivers through browse_caregivers() or
-- caregiver_cards(), which return a fixed set of safe columns.
create policy cna_profiles_select_scoped on public.cna_profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists cna_verifications_select_public on public.cna_verifications;
drop policy if exists cna_verifications_select_scoped on public.cna_verifications;
create policy cna_verifications_select_scoped on public.cna_verifications
  for select to authenticated using (cna_id = auth.uid() or kindred_internal.is_admin());

-- jobs: only LISTED caregivers read open jobs directly (street address etc).
-- Everyone else uses browse_open_jobs(), which withholds the address.
drop policy if exists jobs_select_open_for_cnas on public.jobs;
create policy jobs_select_open_for_cnas on public.jobs
  for select using (
    status in ('open', 'in_review')
    and kindred_internal.current_user_role() = 'cna'
    and kindred_internal.is_listed(auth.uid())
  );
-- A caregiver can always read a job they already applied to.
drop policy if exists jobs_select_applied_cna on public.jobs;
create policy jobs_select_applied_cna on public.jobs
  for select to authenticated using (
    exists (select 1 from public.job_applications ja
            where ja.job_id = jobs.id and ja.cna_id = auth.uid())
  );

-- Applying requires being listed (vetted + member).
drop policy if exists job_applications_insert_cna on public.job_applications;
create policy job_applications_insert_cna on public.job_applications
  for insert with check (cna_id = auth.uid() and kindred_internal.is_listed(auth.uid()));

-- Families must be members to START a conversation. Caregivers can start one
-- only with someone they're already connected to (e.g. replying after a hire).
drop policy if exists message_threads_insert_party on public.message_threads;
create policy message_threads_insert_party on public.message_threads
  for insert with check (
    (participant_a = auth.uid() or participant_b = auth.uid())
    and (
      kindred_internal.is_admin()
      or (kindred_internal.current_user_role() = 'client' and kindred_internal.is_member(auth.uid()))
      or kindred_internal.is_connected(participant_a, participant_b)
    )
  );

-- Free text (bio / headline) often contains the caregiver's own name. In the
-- locked preview, replace whole-word, case-insensitive matches with an initial.
create or replace function kindred_internal.mask_names(body text, first_name text, last_name text)
returns text language plpgsql immutable set search_path = '' as $$
declare
  out_text text := body;
  tok text;
begin
  if out_text is null then return null; end if;
  -- contact details never belong in a preview
  out_text := regexp_replace(out_text, '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}', '[email hidden]', 'g');
  out_text := regexp_replace(out_text, '(\+?1[ .-]?)?\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}', '[phone hidden]', 'g');
  -- every word of the caregiver's names (handles "Mary Ann", "Lisa N.", hyphens)
  foreach tok in array regexp_split_to_array(coalesce(first_name, '') || ' ' || coalesce(last_name, ''), '[^[:alpha:]'']+') loop
    if length(tok) >= 2 then
      out_text := regexp_replace(
        out_text,
        '\m' || regexp_replace(tok, '([.^$|?*+()\[\]{}\\-])', '\\\1', 'g') || '\M',
        upper(left(tok, 1)) || '.',
        'gi');
      -- names glued to other words ("LisaNguyen"); only for longer names so
      -- short ones ("Al") don't mangle ordinary words ("also")
      if length(tok) >= 4 then
      out_text := regexp_replace(
        out_text,
        regexp_replace(tok, '([.^$|?*+()\[\]{}\\-])', '\\\1', 'g'),
        upper(left(tok, 1)) || '.',
        'gi');
      end if;
    end if;
  end loop;
  return out_text;
end;
$$;
grant execute on function kindred_internal.mask_names(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- public RPCs
-- The locked preview. Returns ONLY listed caregivers, with identity fields
-- withheld unless the viewer is a member family, connected, the caregiver
-- themself, or an admin.
create or replace function public.browse_caregivers()
returns table (
  user_id uuid,
  display_name text,
  last_name text,
  photo_url text,
  headline text,
  bio text,
  hourly_rate_cents integer,
  years_experience integer,
  experience_hours integer,
  languages text[],
  gender text,
  service_zip text,
  service_radius_miles integer,
  availability_status public.cna_availability_status,
  rating_avg numeric,
  rating_count integer,
  services text[],
  identity_unlocked boolean
)
language sql stable security definer set search_path = '' as $$
  with viewer as (
    select auth.uid() as id,
           kindred_internal.is_admin() as is_admin,
           (kindred_internal.current_user_role() = 'client'
              and kindred_internal.is_member(auth.uid())) as member_family
  )
  select
    -- Locked viewers get a stable pseudonymous id, not the real user id
    -- (real ids would let someone guess avatar URLs or target a person).
    case when u.full_access then p.user_id
         else kindred_internal.preview_id(p.user_id) end,
    case when u.full_access then p.display_name
         else nullif(left(coalesce(p.display_name, ''), 1), '') end,
    case when u.full_access then p.last_name end,
    case when u.full_access then p.photo_url end,
    case when u.full_access then p.headline
         else kindred_internal.mask_names(p.headline, p.display_name, p.last_name) end,
    case when u.full_access then p.bio
         else kindred_internal.mask_names(p.bio, p.display_name, p.last_name) end,
    p.hourly_rate_cents,
    p.years_experience,
    p.experience_hours,
    p.languages,
    p.gender,
    p.service_zip,
    p.service_radius_miles,
    p.availability_status,
    p.rating_avg,
    p.rating_count,
    coalesce((select array_agg(st.label order by st.display_order)
                from public.cna_services cs
                join public.service_taxonomy st on st.key = cs.service_key
               where cs.cna_id = p.user_id), '{}'),
    u.full_access
  from public.cna_profiles p
  cross join viewer v
  cross join lateral (
    select (coalesce(v.is_admin, false) or coalesce(v.member_family, false) or coalesce(p.user_id = v.id, false)
            or coalesce(kindred_internal.is_connected(v.id, p.user_id), false)) as full_access
  ) u
  where kindred_internal.is_listed(p.user_id)
    and p.availability_status <> 'inactive'
  order by p.rating_avg desc nulls last, p.rating_count desc, p.created_at;
$$;
revoke all on function public.browse_caregivers() from public;
grant execute on function public.browse_caregivers() to anon, authenticated;

-- Caregiver-side locked preview of open job posts.
create or replace function public.browse_open_jobs()
returns table (
  id uuid,
  title text,
  description text,
  schedule_type public.job_schedule_type,
  hours_per_week integer,
  budget_min_cents integer,
  budget_max_cents integer,
  services_needed text[],
  city text,
  state text,
  zip text,
  street_address text,
  start_date date,
  posted_at timestamptz,
  status public.job_status,
  details_unlocked boolean
)
language sql stable security definer set search_path = '' as $$
  with viewer as (
    select auth.uid() as id,
           coalesce(kindred_internal.is_admin(), false) as is_admin,
           coalesce(kindred_internal.is_listed(auth.uid()), false) as listed
  )
  select
    j.id, j.title, j.description, j.schedule_type, j.hours_per_week,
    j.budget_min_cents, j.budget_max_cents, j.services_needed,
    j.city, j.state, j.zip,
    case when v.is_admin or v.listed or j.client_id = v.id then j.street_address end,
    j.start_date, j.posted_at, j.status,
    (v.is_admin or v.listed or coalesce(j.client_id = v.id, false))
  from public.jobs j
  cross join viewer v
  where j.status in ('open', 'in_review')
  order by j.posted_at desc nulls last, j.created_at desc;
$$;
revoke all on function public.browse_open_jobs() from public;
grant execute on function public.browse_open_jobs() to anon, authenticated;

-- Safe caregiver details for people who are allowed to see them: the
-- caregiver, admins, anyone connected to them (thread / application), and
-- member families looking at a listed caregiver. Never returns application
-- answers, notes, license numbers, resumes or Stripe ids.
create or replace function public.caregiver_cards(ids uuid[])
returns table (
  user_id uuid,
  display_name text,
  last_name text,
  photo_url text,
  headline text,
  bio text,
  hourly_rate_cents integer,
  years_experience integer,
  experience_hours integer,
  rating_avg numeric,
  rating_count integer,
  tier public.cna_tier,
  completed_shifts_count integer,
  languages text[],
  service_zip text,
  availability_status public.cna_availability_status
)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.display_name, p.last_name, p.photo_url, p.headline, p.bio,
         p.hourly_rate_cents, p.years_experience, p.experience_hours,
         p.rating_avg, p.rating_count, p.tier, p.completed_shifts_count,
         p.languages, p.service_zip, p.availability_status
  from public.cna_profiles p
  where p.user_id = any(ids)
    and auth.uid() is not null
    and (
      p.user_id = auth.uid()
      or coalesce(kindred_internal.is_admin(), false)
      or kindred_internal.is_connected(auth.uid(), p.user_id)
      or (kindred_internal.current_user_role() = 'client'
          and kindred_internal.is_member(auth.uid())
          and kindred_internal.is_listed(p.user_id))
    );
$$;
revoke all on function public.caregiver_cards(uuid[]) from public;
grant execute on function public.caregiver_cards(uuid[]) to authenticated;

-- What the signed-in user can do right now. One round trip for the UI.
create or replace function public.my_access()
returns table (
  role public.user_role,
  is_member boolean,
  membership_status public.membership_status,
  founding boolean,
  current_period_end timestamptz,
  meets_standard boolean,
  is_listed boolean,
  founding_slots_left integer
)
language sql stable security definer set search_path = '' as $$
  select
    u.role,
    kindred_internal.is_member(u.id),
    coalesce(m.status, 'none'::public.membership_status),
    coalesce(m.founding, false),
    m.current_period_end,
    case when u.role = 'cna' then kindred_internal.meets_kindred_standard(u.id) else null end,
    case when u.role = 'cna' then kindred_internal.is_listed(u.id) else null end,
    greatest(0,
      coalesce((select (s.value #>> '{}')::int from public.platform_settings s
                 where s.key = 'founding_caregiver_cap'), 25)
      - (select count(*)::int from public.memberships f where f.founding and f.role = 'cna'))
  from public.users u
  left join public.memberships m on m.user_id = u.id
  where u.id = auth.uid();
$$;
revoke all on function public.my_access() from public;
grant execute on function public.my_access() to authenticated;

notify pgrst, 'reload schema';
