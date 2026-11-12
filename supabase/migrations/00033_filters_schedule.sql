-- 00033 — data behind the full filter set (Nov 12, 2026)
--
-- Families can now say WHICH days and WHAT time of day they need help when
-- they post a job, so caregivers can filter by it. Browse results also carry
-- the fields the new filters use: caregiver credential, age range, service
-- keys and weekly availability; job days/times and the care recipient's age
-- range (a bracket only, never a birth date).

alter table public.jobs
  add column if not exists days text[] not null default '{}',
  add column if not exists start_time time,
  add column if not exists end_time time;

alter table public.jobs drop constraint if exists jobs_days_chk;
alter table public.jobs add constraint jobs_days_chk
  check (days <@ array['sun','mon','tue','wed','thu','fri','sat']::text[]);

alter table public.cna_profiles drop constraint if exists cna_profiles_age_bracket_chk;
alter table public.cna_profiles add constraint cna_profiles_age_bracket_chk
  check (age_bracket is null or age_bracket in ('20s','30s','40s','50s','60s+'));

alter table public.cna_profiles drop constraint if exists cna_profiles_gender_chk;
alter table public.cna_profiles add constraint cna_profiles_gender_chk
  check (gender is null or gender in ('female','male','nonbinary'));

-- Age range of a care recipient, from their birth date. Only the bracket
-- ever leaves the database.
create or replace function kindred_internal.age_bracket(dob date)
returns text language sql stable set search_path = '' as $$
  select case
    when dob is null then null
    when extract(year from age(dob)) < 60 then 'under_60'
    when extract(year from age(dob)) < 70 then '60s'
    when extract(year from age(dob)) < 80 then '70s'
    when extract(year from age(dob)) < 90 then '80s'
    else '90s+'
  end;
$$;
grant execute on function kindred_internal.age_bracket(date) to anon, authenticated, service_role;

-- ---------------------------------------------------------------- browse_caregivers
drop function if exists public.browse_caregivers();
create function public.browse_caregivers()
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
  identity_unlocked boolean,
  service_keys text[],
  credential text,
  age_bracket text,
  availability jsonb
)
language sql stable security definer set search_path = '' as $$
  with viewer as (
    select auth.uid() as id,
           kindred_internal.is_admin() as is_admin,
           (kindred_internal.current_user_role() = 'client'
              and kindred_internal.is_member(auth.uid())) as member_family
  )
  select
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
    u.full_access,
    coalesce((select array_agg(cs.service_key order by cs.service_key)
                from public.cna_services cs
               where cs.cna_id = p.user_id), '{}'),
    p.credential,
    p.age_bracket,
    coalesce((select jsonb_agg(jsonb_build_object('d', a.day_of_week, 's', a.start_time, 'e', a.end_time))
                from public.cna_availability a
               where a.cna_id = p.user_id and a.is_active), '[]'::jsonb)
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

-- ---------------------------------------------------------------- browse_open_jobs
drop function if exists public.browse_open_jobs();
create function public.browse_open_jobs()
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
  details_unlocked boolean,
  days text[],
  start_time time,
  end_time time,
  recipient_age_bracket text
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
    (v.is_admin or v.listed or coalesce(j.client_id = v.id, false)),
    j.days, j.start_time, j.end_time,
    (select kindred_internal.age_bracket(cr.date_of_birth)
       from public.care_recipients cr where cr.id = j.care_recipient_id)
  from public.jobs j
  cross join viewer v
  where j.status in ('open', 'in_review')
  order by j.posted_at desc nulls last, j.created_at desc;
$$;
revoke all on function public.browse_open_jobs() from public;
grant execute on function public.browse_open_jobs() to anon, authenticated;
