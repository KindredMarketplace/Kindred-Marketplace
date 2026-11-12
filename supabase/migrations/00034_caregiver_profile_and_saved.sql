-- 00034 — full caregiver profile page + families saving caregivers (Nov 12, 2026)
--
-- browse_caregiver(id): one row from browse_caregivers(), so the profile page
-- shows exactly what Browse is allowed to show (same redaction; locked
-- viewers use the same pseudonymous id they saw in Browse).
--
-- Saving: families can heart a caregiver even before they're members. The
-- heart is stored against the real caregiver (favorites), but the family only
-- ever sends and receives the id they were shown.

create or replace function public.browse_caregiver(target uuid)
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
  select * from public.browse_caregivers() b where b.user_id = target limit 1;
$$;
revoke all on function public.browse_caregiver(uuid) from public;
grant execute on function public.browse_caregiver(uuid) to anon, authenticated;

-- The real caregiver behind an id this viewer was shown in Browse.
create or replace function kindred_internal.resolve_shown_caregiver(shown uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select p.user_id
    from public.cna_profiles p
   where kindred_internal.is_listed(p.user_id)
     and (
       p.user_id = shown and (
         coalesce(kindred_internal.is_admin(), false)
         or (kindred_internal.current_user_role() = 'client' and kindred_internal.is_member(auth.uid()))
         or coalesce(kindred_internal.is_connected(auth.uid(), p.user_id), false)
       )
       or kindred_internal.preview_id(p.user_id) = shown
     )
   limit 1;
$$;
revoke all on function kindred_internal.resolve_shown_caregiver(uuid) from public, anon, authenticated;

-- Ids of the caregivers this family saved, as this family sees them.
create or replace function public.my_saved_caregivers()
returns setof uuid
language sql stable security definer set search_path = '' as $$
  select case
           when (kindred_internal.current_user_role() = 'client' and kindred_internal.is_member(auth.uid()))
             or coalesce(kindred_internal.is_connected(auth.uid(), f.cna_id), false)
           then f.cna_id
           else kindred_internal.preview_id(f.cna_id)
         end
    from public.favorites f
   where f.client_id = auth.uid();
$$;
revoke all on function public.my_saved_caregivers() from public;
grant execute on function public.my_saved_caregivers() to authenticated;

-- Save or un-save. Returns whether it's saved afterwards.
create or replace function public.toggle_saved_caregiver(shown uuid)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  real_id uuid;
begin
  if auth.uid() is null or kindred_internal.current_user_role() <> 'client' then
    raise exception 'Only family accounts can save caregivers.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.client_profiles where user_id = auth.uid()) then
    raise exception 'Finish your care details first.' using errcode = 'P0001';
  end if;
  real_id := kindred_internal.resolve_shown_caregiver(shown);
  if real_id is null then
    raise exception 'That caregiver isn''t available.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.favorites where client_id = auth.uid() and cna_id = real_id) then
    delete from public.favorites where client_id = auth.uid() and cna_id = real_id;
    return false;
  end if;
  insert into public.favorites (client_id, cna_id) values (auth.uid(), real_id);
  return true;
end;
$$;
revoke all on function public.toggle_saved_caregiver(uuid) from public;
grant execute on function public.toggle_saved_caregiver(uuid) to authenticated;
