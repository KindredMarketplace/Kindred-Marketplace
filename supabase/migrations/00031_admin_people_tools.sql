-- =============================================================================
-- 00031 — Admin people tools (Nick, Nov 10)
--
-- 1. admin_prepare_user_delete(target): clears the rows that would otherwise
--    BLOCK deleting an account (reviews, bookings and their payment trail,
--    old facility rows, the view-as log), so the server can then delete the
--    auth user and everything else cascades. Admin accounts are refused.
--    Callable by the server (service_role) only; the admin check happens in
--    the server action before it's called.
--
-- 2. access_for(uid): the same snapshot as my_access(), for any user, but
--    only answers for admins. Used when an admin is "viewing as" someone so
--    their membership / listing status shows correctly.
-- =============================================================================

create or replace function public.admin_prepare_user_delete(target uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  r text;
begin
  select u.role::text into r from public.users u where u.id = target;
  if r is null then
    return;
  end if;
  if r = 'admin' then
    raise exception 'Admin accounts cannot be deleted from the dashboard';
  end if;

  delete from public.reviews where reviewer_id = target or reviewee_id = target;

  delete from public.refunds
   where payment_id in (
     select p.id from public.payments p
      where p.client_id = target or p.cna_id = target
         or p.booking_id in (select b.id from public.bookings b where b.client_id = target or b.cna_id = target)
   );
  delete from public.payments
   where client_id = target or cna_id = target
      or booking_id in (select b.id from public.bookings b where b.client_id = target or b.cna_id = target);

  delete from public.invoice_line_items
   where timesheet_id in (select t.id from public.timesheets t where t.cna_id = target or t.supervisor_id = target);
  delete from public.timesheets where cna_id = target or supervisor_id = target;

  delete from public.bookings where client_id = target or cna_id = target;

  delete from public.approved_roster where saved_by_user_id = target;
  delete from public.business_shifts where posted_by_user_id = target;

  delete from public.admin_impersonation_log where impersonated_user_id = target;
end;
$$;

revoke all on function public.admin_prepare_user_delete(uuid) from public, anon, authenticated;
grant execute on function public.admin_prepare_user_delete(uuid) to service_role;

create or replace function public.access_for(uid uuid)
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
  where u.id = uid
    and kindred_internal.is_admin();
$$;

revoke all on function public.access_for(uuid) from public, anon;
grant execute on function public.access_for(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
