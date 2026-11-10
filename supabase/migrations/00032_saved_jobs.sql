-- =============================================================================
-- 00032 — Saved jobs (the ♡ on Find jobs)
--
-- A caregiver can save a job to come back to it. Private to them (and
-- admins); nobody else, including the family, can see who saved what.
-- =============================================================================

create table if not exists public.saved_jobs (
  cna_id uuid not null references public.cna_profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cna_id, job_id)
);

create index if not exists saved_jobs_cna_idx on public.saved_jobs(cna_id, created_at desc);

alter table public.saved_jobs enable row level security;

drop policy if exists saved_jobs_select on public.saved_jobs;
create policy saved_jobs_select on public.saved_jobs
  for select to authenticated
  using (cna_id = auth.uid() or kindred_internal.is_admin());

drop policy if exists saved_jobs_insert on public.saved_jobs;
create policy saved_jobs_insert on public.saved_jobs
  for insert to authenticated
  with check (cna_id = auth.uid() and kindred_internal.current_user_role() = 'cna');

drop policy if exists saved_jobs_delete on public.saved_jobs;
create policy saved_jobs_delete on public.saved_jobs
  for delete to authenticated
  using (cna_id = auth.uid());

revoke all on public.saved_jobs from anon;
grant select, insert, delete on public.saved_jobs to authenticated;

notify pgrst, 'reload schema';
