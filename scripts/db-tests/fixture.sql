create role anon nologin; create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
create type public.user_role as enum ('client','cna','business','admin');
create type public.verification_type as enum ('l2bg','cpr','license','insurance','identity');
create type public.verification_status as enum ('pending','verified','rejected','expired');
create type public.cna_availability_status as enum ('available','fully_booked','on_break','inactive');
create type public.job_schedule_type as enum ('one_time','recurring','live_in','on_call');
create type public.job_status as enum ('draft','open','in_review','filled','cancelled','expired');
create type public.cna_tier as enum ('new','verified','top_rated');
create type public.user_status as enum ('pending','active','suspended','deleted');
create type public.job_application_status as enum ('submitted','shortlisted','rejected','withdrawn','accepted');
create table public.users (id uuid primary key, role public.user_role not null, full_name text, status public.user_status not null default 'active', email text, username text);
create table public.cna_profiles (user_id uuid primary key references public.users(id), display_name text not null, last_name text, photo_url text, headline text, bio text,
  hourly_rate_cents int, years_experience int, languages text[], gender text, service_zip text, service_radius_miles int,
  availability_status public.cna_availability_status not null default 'available', rating_avg numeric, rating_count int default 0,
  application_status text, application_notes text, application_decline_reason text, interview_at timestamptz, license_number text,
  tier public.cna_tier default 'new', stripe_account_id text, stripe_onboarding_complete boolean default false, completed_shifts_count int default 0, bg_check_status text, bg_check_completed_at timestamptz, license_verified_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.cna_verifications (id serial primary key, cna_id uuid references public.users(id), type public.verification_type, status public.verification_status, expires_at date, verified_at timestamptz, notes text, created_at timestamptz default now());
create table public.service_taxonomy (key text primary key, label text, display_order int);
create table public.cna_services (cna_id uuid, service_key text);
create table public.jobs (id uuid primary key default gen_random_uuid(), client_id uuid references public.users(id), title text, description text, schedule_type public.job_schedule_type default 'recurring',
  hours_per_week int, budget_min_cents int, budget_max_cents int, services_needed text[], city text, state text, zip text, street_address text, start_date date,
  posted_at timestamptz default now(), status public.job_status default 'open', created_at timestamptz default now());
create table public.job_applications (id serial primary key, job_id uuid references public.jobs(id), cna_id uuid references public.users(id), status public.job_application_status default 'submitted');
create table public.bookings (id serial primary key, client_id uuid, cna_id uuid);
create table public.message_threads (id serial primary key, participant_a uuid, participant_b uuid, job_id uuid, started_by uuid, started_via text default 'browse',
  status text default 'pending_request' check (status in ('pending_request','accepted','declined','blocked')), last_message_preview text, unread_count_a int default 0, unread_count_b int default 0,
  updated_at timestamptz default now());
create table public.messages (id serial primary key, thread_id int references public.message_threads(id), sender_id uuid, recipient_id uuid, body text, read_at timestamptz);
create function public.messages_update_thread_summary() returns trigger language plpgsql as $$
begin
  update public.message_threads set last_message_preview = left(new.body, 80),
    unread_count_a = unread_count_a + case when participant_a = new.recipient_id then 1 else 0 end,
    unread_count_b = unread_count_b + case when participant_b = new.recipient_id then 1 else 0 end
  where id = new.thread_id;
  return new;
end $$;
create function public.messages_after_read_update() returns trigger language plpgsql as $$ begin return new; end $$;
create trigger messages_after_insert after insert on public.messages for each row execute function public.messages_update_thread_summary();
create trigger messages_after_read after update on public.messages for each row execute function public.messages_after_read_update();
create table public.cna_availability (id serial primary key, cna_id uuid, day text);
create table public.cna_availability_overrides (id serial primary key, cna_id uuid, day date);
create table public.cna_service_areas (id serial primary key, cna_id uuid, zip text);
create table public.reviews (id serial primary key, reviewer_id uuid, reviewee_id uuid, rating int, is_visible boolean default true);
-- signup trigger (production version from 00002 + username)
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = 'public' as $$
begin
  insert into public.users (id, email, full_name, role, username)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'),
          coalesce(lower(new.raw_user_meta_data->>'username'), 'user_' || substring(new.id::text, 1, 8)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create schema kindred_internal;
create function kindred_internal.is_admin(user_uuid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.users where id = user_uuid and role = 'admin' and status = 'active') $$;
create function kindred_internal.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select kindred_internal.is_admin(auth.uid()) $$;
create function kindred_internal.current_user_role() returns public.user_role language sql stable security definer set search_path = public as $$ select role from public.users where id = auth.uid() $$;
grant usage on schema kindred_internal to authenticated;
-- original (pre-00024) policies
alter table public.cna_profiles enable row level security;
alter table public.cna_verifications enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.message_threads enable row level security;
alter table public.users enable row level security;
create policy cna_profiles_select_public on public.cna_profiles for select using (true);
create policy "Admins can read all cna_profiles" on public.cna_profiles for select to authenticated using (kindred_internal.is_admin());
create policy cna_verifications_select_public on public.cna_verifications for select using (true);
create policy jobs_select_owner on public.jobs for select using (client_id = auth.uid() or kindred_internal.is_admin(auth.uid()));
create policy jobs_select_open_for_cnas on public.jobs for select using (status in ('open','in_review') and kindred_internal.current_user_role() = 'cna');
create policy job_applications_insert_cna on public.job_applications for insert with check (cna_id = auth.uid());
create policy job_applications_select on public.job_applications for select using (cna_id = auth.uid());
create policy job_applications_update_parties on public.job_applications for update using (cna_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_applications.job_id and j.client_id = auth.uid()));
create policy message_threads_insert_party on public.message_threads for insert with check (participant_a = auth.uid() or participant_b = auth.uid());
create policy message_threads_select on public.message_threads for select using (participant_a = auth.uid() or participant_b = auth.uid());
create policy users_self on public.users for select using (id = auth.uid());
create policy users_update_self on public.users for update using (id = auth.uid()) with check (id = auth.uid());
alter table public.messages enable row level security;
create policy messages_insert_sender on public.messages for insert with check (sender_id = auth.uid());
create policy messages_select_party on public.messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
alter table public.cna_services enable row level security;
create policy cna_services_select_public on public.cna_services for select using (true);
alter table public.cna_availability enable row level security;
create policy cna_availability_select_public on public.cna_availability for select using (true);
alter table public.cna_availability_overrides enable row level security;
create policy cna_availability_overrides_select_public on public.cna_availability_overrides for select using (true);
alter table public.cna_service_areas enable row level security;
create policy cna_service_areas_select_public on public.cna_service_areas for select using (true);
alter table public.reviews enable row level security;
create policy reviews_select_own on public.reviews for select using (reviewer_id = auth.uid() or reviewee_id = auth.uid());
create policy reviews_select_public_visible on public.reviews for select using (is_visible = true);
create policy cna_profiles_insert_self on public.cna_profiles for insert with check (user_id = auth.uid());
create policy cna_profiles_update_self on public.cna_profiles for update using (user_id = auth.uid() or kindred_internal.is_admin(auth.uid())) with check (user_id = auth.uid() or kindred_internal.is_admin(auth.uid()));
create policy cna_verifications_write_self on public.cna_verifications for all using (cna_id = auth.uid() or kindred_internal.is_admin(auth.uid())) with check (cna_id = auth.uid() or kindred_internal.is_admin(auth.uid()));
alter table public.bookings enable row level security;
create policy bookings_insert_party on public.bookings for insert with check (client_id = auth.uid() or cna_id = auth.uid());
create policy bookings_select_parties on public.bookings for select using (client_id = auth.uid() or cna_id = auth.uid());
create policy jobs_insert_self on public.jobs for insert with check (client_id = auth.uid());
-- Supabase's default: anon + authenticated get ALL privileges; RLS is the gate.
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant usage on all sequences in schema public to authenticated;
-- seed
insert into public.users values
 ('00000000-0000-0000-0000-00000000000a','admin','Admin'),
 ('00000000-0000-0000-0000-0000000000c1','client','Fam Member'),
 ('00000000-0000-0000-0000-0000000000c2','client','Fam Free'),
 ('00000000-0000-0000-0000-0000000000e1','cna','Listed Lisa'),
 ('00000000-0000-0000-0000-0000000000e2','cna','Approved No Docs'),
 ('00000000-0000-0000-0000-0000000000e3','cna','Pending Pat');
insert into public.cna_profiles (user_id, display_name, last_name, photo_url, application_status, application_notes, license_number, created_at) values
 ('00000000-0000-0000-0000-0000000000e1','Lisa','Nguyen','https://x/p.jpg','approved','secret note','CNA123', now() - interval '3 days'),
 ('00000000-0000-0000-0000-0000000000e2','Ben','Ortiz',null,'approved','note2','CNA456', now() - interval '2 days'),
 ('00000000-0000-0000-0000-0000000000e3','Pat','Lee',null,'submitted','note3',null, now() - interval '1 day');
insert into public.jobs (id, client_id, title, city, zip, street_address) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000c2','Evenings for Mom','Gainesville','32601','123 Secret St');
