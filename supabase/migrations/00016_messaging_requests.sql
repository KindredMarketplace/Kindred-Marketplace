-- =============================================================================
-- 00016_messaging_requests.sql
-- Adds the "request vs conversation" model to message_threads.
--
-- Design (locked in with the product owner):
--   - A thread is between exactly two users (one client + one CNA).
--   - When a new thread is created, it starts in status='pending_request'.
--   - The recipient sees it under their "Requests" tab. The sender sees it in
--     their normal "Conversations" tab (they already opted in by sending).
--   - The recipient replying for the first time auto-promotes the thread to
--     status='accepted'. Implicit SMS-style accept — no separate Accept button.
--   - Hiring a CNA on a job application also auto-promotes any existing
--     thread between that client+cna pair, and creates one if none exists.
--
-- Entry points (both family-initiated; CNAs cannot cold-outreach):
--   1. Family clicks "Message" on a caregiver in /client/browse
--        → started_via = 'browse', status = 'pending_request'
--   2. Family clicks "Message applicant" on an application card
--        → started_via = 'application_review', status = 'pending_request'
--   3. Family hires an applicant
--        → if thread exists, promote to 'accepted'
--        → if no thread exists, create one with started_via = 'hire',
--          status = 'accepted' (skip the request step entirely — they're
--          already working together).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New columns on message_threads
-- ---------------------------------------------------------------------------

alter table public.message_threads
  add column status text not null default 'accepted'
    check (status in ('pending_request', 'accepted', 'declined', 'blocked')),
  add column started_by uuid references public.users(id) on delete set null,
  add column started_via text
    check (started_via in ('browse', 'application_review', 'hire', 'system')),
  add column unread_count_a integer not null default 0,
  add column unread_count_b integer not null default 0,
  add column accepted_at timestamptz;

-- Existing threads (none in production yet, but be safe) keep status='accepted'
-- because they predate this concept and presumably represent active conversations.

comment on column public.message_threads.status is
  'pending_request: recipient has not yet replied. accepted: both parties messaging. declined/blocked: recipient said no.';
comment on column public.message_threads.started_by is
  'Which participant initiated this thread. The OTHER participant is the recipient who needs to reply to accept.';
comment on column public.message_threads.unread_count_a is
  'Unread messages for participant_a (the smaller UUID). Updated by message-insert trigger.';
comment on column public.message_threads.unread_count_b is
  'Unread messages for participant_b. Updated by message-insert trigger.';

-- ---------------------------------------------------------------------------
-- 2. Loosen the unique constraint
--
-- The original `unique (participant_a, participant_b, job_id, booking_id)`
-- would let two people have multiple threads if one is job-tagged and one
-- isn't. We want exactly ONE durable thread per pair, so the recipient's
-- inbox isn't fragmented. Job + booking context becomes informational, not
-- a uniqueness key.
-- ---------------------------------------------------------------------------

-- Drop the old multi-column unique constraint if it exists. The hosted DB
-- may have named it differently from the local migration, so we look it up
-- dynamically instead of dropping by hardcoded name. Any unique constraint
-- on this table that spans more than two columns is the legacy one we want
-- gone (the new constraint we add below is exactly 2 columns).
do $
declare
  con_name text;
begin
  for con_name in
    select conname from pg_constraint
    where conrelid = 'public.message_threads'::regclass
      and contype = 'u'
      and array_length(conkey, 1) > 2
  loop
    execute format('alter table public.message_threads drop constraint %I', con_name);
  end loop;
end $;

-- Add the new pair-only unique constraint. Defensive: only if not present.
do $
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.message_threads'::regclass
      and conname = 'message_threads_unique_pair'
  ) then
    alter table public.message_threads
      add constraint message_threads_unique_pair unique (participant_a, participant_b);
  end if;
end $;

-- ---------------------------------------------------------------------------
-- 3. Helper: which "side" is a given user in a thread?
--
-- Since we normalize so participant_a < participant_b, we need a helper to
-- figure out whether to bump unread_count_a or unread_count_b when a new
-- message arrives.
-- ---------------------------------------------------------------------------

create or replace function kindred_internal.thread_side(thread_row public.message_threads, user_id uuid)
returns text
language sql
immutable
as $$
  select case
    when thread_row.participant_a = user_id then 'a'
    when thread_row.participant_b = user_id then 'b'
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Update the message-insert trigger so it ALSO:
--    a) bumps the recipient's unread_count
--    b) promotes the thread to 'accepted' if a pending_request gets a reply
--       from the RECIPIENT (i.e. someone other than started_by)
--
-- We replace the existing function from 00005 with a richer version.
-- ---------------------------------------------------------------------------

create or replace function public.messages_update_thread_summary()
returns trigger
language plpgsql
as $$
declare
  thread_row public.message_threads%rowtype;
  recipient_side text;
  should_promote boolean := false;
begin
  -- Lock the thread row so concurrent inserts don't race on unread counts.
  select * into thread_row
  from public.message_threads
  where id = new.thread_id
  for update;

  if thread_row.id is null then
    -- Defensive: thread was deleted between the message insert and this
    -- trigger. The FK on messages.thread_id would normally prevent this,
    -- but be safe.
    return new;
  end if;

  -- Figure out which side is the recipient (for unread count).
  recipient_side := kindred_internal.thread_side(thread_row, new.recipient_id);

  -- Promote pending_request → accepted when the RECIPIENT of the original
  -- request sends their first reply. "Recipient of the original request" is
  -- anyone who is NOT the started_by user. If started_by is null (legacy
  -- threads), skip promotion.
  if thread_row.status = 'pending_request'
     and thread_row.started_by is not null
     and new.sender_id <> thread_row.started_by then
    should_promote := true;
  end if;

  update public.message_threads
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 200),
    unread_count_a = case when recipient_side = 'a' then unread_count_a + 1 else unread_count_a end,
    unread_count_b = case when recipient_side = 'b' then unread_count_b + 1 else unread_count_b end,
    status = case when should_promote then 'accepted' else status end,
    accepted_at = case when should_promote and accepted_at is null then now() else accepted_at end,
    updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Helper trigger: when a message is marked read, decrement the unread
--    counter on the correct side. Lets us trust the denormalized count
--    without recomputing it every time the inbox loads.
-- ---------------------------------------------------------------------------

create or replace function public.messages_after_read_update()
returns trigger
language plpgsql
as $$
declare
  thread_row public.message_threads%rowtype;
  recipient_side text;
begin
  -- Only act when read_at transitions from NULL → not-NULL.
  if old.read_at is not null or new.read_at is null then
    return new;
  end if;

  select * into thread_row
  from public.message_threads
  where id = new.thread_id
  for update;

  if thread_row.id is null then
    return new;
  end if;

  recipient_side := kindred_internal.thread_side(thread_row, new.recipient_id);

  update public.message_threads
  set
    unread_count_a = case
      when recipient_side = 'a' then greatest(unread_count_a - 1, 0)
      else unread_count_a
    end,
    unread_count_b = case
      when recipient_side = 'b' then greatest(unread_count_b - 1, 0)
      else unread_count_b
    end,
    updated_at = now()
  where id = thread_row.id;

  return new;
end;
$$;

drop trigger if exists messages_after_read on public.messages;
create trigger messages_after_read
  after update of read_at on public.messages
  for each row execute function public.messages_after_read_update();

-- ---------------------------------------------------------------------------
-- 6. Convenience index for the inbox query.
--
-- Inbox query is "all threads where I'm a participant, split by status,
-- sorted by last_message_at desc". The existing indexes from 00005 cover
-- participant_a + last_message_at. Add a status filter index so the
-- Requests tab query is fast.
-- ---------------------------------------------------------------------------

create index if not exists message_threads_a_status_idx
  on public.message_threads(participant_a, status, last_message_at desc);
create index if not exists message_threads_b_status_idx
  on public.message_threads(participant_b, status, last_message_at desc);
