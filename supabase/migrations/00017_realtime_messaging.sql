-- =============================================================================
-- 00017_realtime_messaging.sql
-- Enable Supabase Realtime broadcasts for messages and message_threads.
--
-- Phase C of the messaging build: the client subscribes via the Supabase JS
-- client to changes on these tables (filtered by RLS automatically), so when
-- a counterparty sends a message the open thread page + inbox list refresh
-- without the user hitting reload.
--
-- The supabase_realtime publication is the standard way to opt tables in.
-- RLS still applies to the broadcast payload, so users only receive events
-- for rows they could already SELECT.
-- =============================================================================

-- It's safe to call alter publication ... add table multiple times in some
-- Postgres versions; in others it errors if the table is already in the
-- publication. Use a do-block to make this idempotent.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_threads'
  ) then
    alter publication supabase_realtime add table public.message_threads;
  end if;
end $$;

-- Note: we do NOT enable realtime on `messages.read_at` updates only — the
-- publication broadcasts ALL updates. That's fine; the JS client filters
-- by event type and we only act on INSERT events for the thread chat view.
-- For the inbox, we act on UPDATE events to message_threads (last_message
-- preview, unread counts) and on INSERT events to messages (the row that
-- triggers the thread update).
