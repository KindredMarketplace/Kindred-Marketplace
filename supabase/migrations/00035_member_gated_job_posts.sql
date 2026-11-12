-- 00035 — posting a job is a member feature (Nov 12, 2026; Phase 3 plan).
-- A posted job lets listed caregivers apply, which opens a conversation, so
-- posting has to sit behind the same membership as messaging (comped
-- memberships count). Existing jobs are untouched.
alter policy jobs_insert_self on public.jobs
  with check (
    client_id = auth.uid()
    and kindred_internal.current_user_role() = 'client'::public.user_role
    and (kindred_internal.is_member(auth.uid()) or kindred_internal.is_admin())
  );
