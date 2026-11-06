-- =============================================================================
-- 00025 — Account + messaging hardening (fixes PRE-EXISTING holes found in
-- the Nov 2026 security review; independent of 00024 and safe to apply first)
--
--   1. users_update_self let anyone set their own role = 'admin'. Now role and
--      status can only be changed by an admin or the server.
--   2. handle_new_user trusted `role` from signup metadata (so anyone could
--      sign up as admin via the API). Now only 'client' or 'cna' are accepted.
--   3. messages_insert_sender didn't check the thread: you could post into a
--      thread you're not in, or into a blocked / declined one.
--   4. Thread summary + read-receipt triggers ran as the caller, who has no
--      UPDATE rights on message_threads, so unread counts and previews never
--      saved. They now run as definer (they only touch the thread row).
--   5. Participants can accept / decline / block a thread (needed by the app's
--      promoteThreadToAccepted), but can't rewrite who the thread is between,
--      and can't un-block.
-- =============================================================================

-- ---------------------------------------------------------------- helper
create schema if not exists kindred_internal;

-- "Privileged" = an admin, or a server-side role (service_role / postgres).
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
create or replace function kindred_internal.is_privileged_writer()
returns boolean language sql stable set search_path = '' as $$
  select current_user not in ('anon', 'authenticated') or coalesce(kindred_internal.is_admin(), false);
$$;
grant usage on schema kindred_internal to anon, authenticated;
grant execute on function kindred_internal.is_privileged_writer() to anon, authenticated;

-- ---------------------------------------------------------------- 1. users.role / status
create or replace function kindred_internal.guard_user_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;
  new.role := old.role;
  new.status := old.status;
  new.id := old.id;
  return new;
end;
$$;

drop trigger if exists users_guard_write on public.users;
create trigger users_guard_write
  before update on public.users
  for each row execute function kindred_internal.guard_user_write();

-- ---------------------------------------------------------------- 2. signup role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = 'public' as $function$
declare
  requested text := new.raw_user_meta_data->>'role';
begin
  insert into public.users (id, email, full_name, role, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    -- Only families and caregivers can self-register. Admins are made by hand.
    case when requested in ('client', 'cna') then requested::public.user_role else 'client' end,
    coalesce(
      lower(new.raw_user_meta_data->>'username'),
      'user_' || substring(new.id::text, 1, 8)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- ---------------------------------------------------------------- 3. messages insert
drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.message_threads t
      where t.id = thread_id
        and t.status in ('pending_request', 'accepted')
        and (
          (t.participant_a = auth.uid() and t.participant_b = recipient_id)
          or (t.participant_b = auth.uid() and t.participant_a = recipient_id)
        )
    )
  );

-- ---------------------------------------------------------------- 4. summary triggers
-- These only update the thread row the message belongs to.
alter function public.messages_update_thread_summary() security definer set search_path = 'public';
alter function public.messages_after_read_update() security definer set search_path = 'public';
revoke all on function public.messages_update_thread_summary() from public, anon, authenticated;
revoke all on function public.messages_after_read_update() from public, anon, authenticated;

-- ---------------------------------------------------------------- 5. thread updates
drop policy if exists message_threads_update_party on public.message_threads;
create policy message_threads_update_party on public.message_threads
  for update to authenticated
  using (participant_a = auth.uid() or participant_b = auth.uid())
  with check (participant_a = auth.uid() or participant_b = auth.uid());

create or replace function kindred_internal.guard_thread_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Whoever inserts is who started it; nobody starts a thread pre-accepted
    -- unless they're already connected through a real job application.
    new.started_by := auth.uid();
    if new.status is distinct from 'pending_request' then
      if not exists (
        select 1 from public.job_applications ja join public.jobs j on j.id = ja.job_id
        where ((ja.cna_id = new.participant_a and j.client_id = new.participant_b)
            or (ja.cna_id = new.participant_b and j.client_id = new.participant_a))
          and ja.status not in ('withdrawn', 'rejected')
      ) then
        new.status := 'pending_request';
      end if;
    end if;
    return new;
  end if;

  -- UPDATE: who the thread is between never changes; a block is permanent
  -- unless Kindred lifts it.
  new.participant_a := old.participant_a;
  new.participant_b := old.participant_b;
  new.started_by := old.started_by;
  new.started_via := old.started_via;
  new.job_id := old.job_id;
  if old.status = 'blocked' then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists message_threads_guard_write on public.message_threads;
create trigger message_threads_guard_write
  before insert or update on public.message_threads
  for each row execute function kindred_internal.guard_thread_write();

notify pgrst, 'reload schema';
