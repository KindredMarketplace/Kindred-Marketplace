-- =============================================================================
-- 00028 — Bookings + reviews hardening (pentest 2026-11-06, findings H1 + M1)
--
-- H1: bookings_insert_party let either party insert a booking with ANY
--     counterparty. Because care_recipients_select_assigned_cna grants a
--     caregiver read access to a care recipient once a booking links them,
--     a caregiver could read any family's care-recipient details (DOB,
--     conditions, medications, allergies, notes) with a self-made booking.
-- M1: reviews_insert_self only checked reviewer_id, so a fake booking + review
--     could move a caregiver's public rating.
--
-- Now: a booking can only be created by the FAMILY, for an application they
-- ACCEPTED on their own job, with their own care recipient (this is exactly
-- what the hire flow does). Who a booking is between can't be changed later.
-- A review needs a COMPLETED booking between the reviewer and the reviewee.
-- =============================================================================

drop policy if exists bookings_insert_party on public.bookings;
create policy bookings_insert_party on public.bookings
  for insert with check (
    kindred_internal.is_admin()
    or (
      client_id = auth.uid()
      and kindred_internal.current_user_role() = 'client'
      and exists (
        select 1
        from public.job_applications ja
        join public.jobs j on j.id = ja.job_id
        where ja.job_id = bookings.job_id
          and ja.cna_id = bookings.cna_id
          and ja.status = 'accepted'
          and j.client_id = auth.uid()
      )
      and (
        care_recipient_id is null
        or exists (
          select 1 from public.care_recipients cr
          where cr.id = bookings.care_recipient_id and cr.client_id = auth.uid()
        )
      )
    )
  );

create or replace function kindred_internal.guard_booking_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;
  new.client_id := old.client_id;
  new.cna_id := old.cna_id;
  new.job_id := old.job_id;
  new.care_recipient_id := old.care_recipient_id;
  return new;
end;
$$;

drop trigger if exists bookings_guard_write on public.bookings;
create trigger bookings_guard_write
  before update on public.bookings
  for each row execute function kindred_internal.guard_booking_write();

drop policy if exists reviews_insert_self on public.reviews;
create policy reviews_insert_self on public.reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.status = 'completed'
        and (
          (b.client_id = auth.uid() and b.cna_id = reviews.reviewee_id)
          or (b.cna_id = auth.uid() and b.client_id = reviews.reviewee_id)
        )
    )
  );

create or replace function kindred_internal.guard_review_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if kindred_internal.is_privileged_writer() then
    return new;
  end if;
  new.booking_id := old.booking_id;
  new.reviewer_id := old.reviewer_id;
  new.reviewee_id := old.reviewee_id;
  return new;
end;
$$;

drop trigger if exists reviews_guard_write on public.reviews;
create trigger reviews_guard_write
  before update on public.reviews
  for each row execute function kindred_internal.guard_review_write();

notify pgrst, 'reload schema';
