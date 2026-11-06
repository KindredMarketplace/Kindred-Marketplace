---
title: Kindred App Design
type: spec
status: living
created: 2026-11-05
tags: [build, spec, design]
---

# Kindred App: Design

## 1. Overview

The app already has a public site, a family portal, a caregiver portal, messaging, and a job post/apply/hire loop. What it doesn't have is the business model it is now built around: vetting as the product, access as the revenue, and a locked preview as the storefront. This design adds those three things at the **database** layer first, so the UI can't leak what the server never sends.

## 2. Key design principles

1. **Platform, not employer.** No feature may set a caregiver's rate, take a cut, move care money, track location, or direct the work. When unsure, leave it out.
2. **The server decides who sees what.** Redaction happens in Postgres (RLS and security-definer functions). CSS blur is decoration only.
3. **Honesty filter.** Real data or a clean empty state. No fake caregivers, ratings, counts or testimonials. Badges are earned, then shown.
4. **Dignity.** Copy never infantilizes the person receiving care, and never reduces the caregiver to a commodity.
5. **Config over code for money.** Prices and the founding cap live in tables so Nick can change them without a deploy.

## 3. Technology approach

See `technology_decisions.md`. Summary: Next.js 16 (App Router), Supabase (Postgres, Auth, RLS, Realtime, Storage), Stripe Billing via Checkout, Tailwind, deployed as a PWA.

## 4. Data model additions (migration 00023)

- `access_plans(key pk, role, label, startup_fee_cents, monthly_cents, active)`. Public read. Seeded with `caregiver_standard` and `family_standard`.
- `memberships(user_id pk → users, role, status membership_status, plan_key, founding bool, startup_fee_waived bool, current_period_end, stripe_customer_id, stripe_subscription_id, comp_reason, timestamps)`. The owner reads their own row; admins read all. Writes come only from the service role or admins.
- `cna_profiles.experience_hours int`.
- Enum `verification_type` gains `identity`.
- `kindred_internal.is_member(uid)`, `kindred_internal.meets_kindred_standard(cna_id)`, `kindred_internal.is_connected(a, b)`.
- `public.browse_caregivers()`: security definer, returns safe card rows, identity only for members or connected viewers.
- `public.browse_open_jobs()`: security definer, returns jobs with street address withheld for non-members.
- Trigger: when a caregiver is approved, call `grant_founding_if_available`.
- RLS changes:
  - `cna_profiles` select: self, admin, a member viewing a listed caregiver, or connected. (This replaces `true`.)
  - `cna_verifications` select: self, admin, or connected. Public badges come from the function instead.
  - `jobs` select for caregivers: only listed caregivers read the table directly; everyone else uses `browse_open_jobs()`.

## 5. Correctness properties

- P1. For any viewer who is not a member and not connected, no row returned by `browse_caregivers()` contains a last name, photo URL or a first name longer than one letter. (R5.2)
- P2. For any anonymous request, `select * from cna_profiles` returns zero rows. (R5.6)
- P3. For any caregiver row returned by `browse_caregivers()`, `meets_kindred_standard(user_id)` is true **and** `is_member(user_id)` is true. (R3.2, R4)
- P4. For any user, `is_member` is true if and only if status ∈ {active, comped} and (period end is null or > now()). (R4.2)
- P5. The count of memberships with `founding = true` and `role = 'cna'` never exceeds `founding_caregiver_cap` (25). (R4.5)
- P6. No table or function moves money between a family and a caregiver. (Principle 1)

## 6. Business logic flows

```
Flow: Caregiver goes from applicant to listed
Trigger: caregiver submits application (/apply)
1. application_status = submitted → admin interviews → approved or declined
2. On approved: trigger runs grant_founding_if_available
   - If founding slots remain: membership = comped, founding, 1 year
   - Otherwise: no membership; the caregiver sees the "Activate membership" CTA
3. Caregiver uploads ID, L2 background and insurance proof (compliance page); admin verifies each
4. When meets_kindred_standard AND is_member are both true, the caregiver appears in browse_caregivers()
Postcondition: listed caregiver, visible to families
```

```
Flow: Family from preview to hire
1. Visitor browses /browse (locked preview: initial, rate, experience, badges)
2. Clicks "Message" → sign up as family (if logged out) → /client/membership
3. Stripe Checkout (startup + monthly) → webhook sets membership active
4. Family sees full names and photos, messages the caregiver, interviews, hires
5. Family pays the caregiver directly. Kindred is not involved.
```

```
Flow: Stripe sync
- checkout.session.completed (metadata.user_id) → status active, store customer + subscription, period end
- customer.subscription.updated → mirror status (active/past_due/canceled) + period end
- customer.subscription.deleted → canceled
- invoice.payment_failed → past_due
```

## 7. Error handling

| Error | Response |
|---|---|
| Stripe keys missing | Membership page shows "Memberships open at launch". Checkout route returns 503 with a friendly message. Nothing crashes. |
| Webhook signature invalid | 400. No DB writes. |
| Webhook for unknown user | Logged, 200 (so Stripe stops retrying), no write |
| Non-member tries to message | Server action refuses. UI shows the unlock CTA |
| Founding cap reached | Approval still succeeds. The caregiver just gets no comp |
| Expired verification | Caregiver drops out of browse automatically (the function checks expiry) |

## 8. Testing strategy

- SQL property checks run against the live DB as `anon` and as `authenticated` with crafted JWT claims: P1, P2, P4, P5.
- `tsc --noEmit` and `next build` must pass.
- Playwright smoke test: landing, /browse, /kindred-standard, /login render with no console errors; manifest and service worker are served; screenshots at 390px and 1280px.
- Unit tests for `lib/membership.ts` pure helpers (price formatting, member status).
