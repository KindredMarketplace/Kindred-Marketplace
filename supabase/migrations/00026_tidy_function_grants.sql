-- 00026 — Tidy-up after the Supabase security advisor (Nov 2026)
-- Supabase's default privileges give anon EXECUTE on new public functions.
-- These two only make sense for signed-in users (they already return nothing
-- without a login, this just makes it explicit).
revoke execute on function public.caregiver_cards(uuid[]) from anon;
revoke execute on function public.my_access() from anon;

-- Internal helpers that should never be callable from the API.
revoke execute on function kindred_internal.preview_id(uuid) from anon, authenticated;
revoke execute on function kindred_internal.grant_founding_if_available(uuid) from anon, authenticated;
revoke execute on function kindred_internal.on_cna_approved() from anon, authenticated;
revoke execute on function kindred_internal.is_connected(uuid, uuid) from anon;

-- Pre-existing advisor warning: mutable search_path.
alter function kindred_internal.thread_side(public.message_threads, uuid) set search_path = 'public';

notify pgrst, 'reload schema';
