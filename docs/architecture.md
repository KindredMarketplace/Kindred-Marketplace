# Kindred Architecture

Last updated during AFK scaffolding session.

This doc captures the *why* behind the schema decisions — the things that aren't obvious from reading the SQL. Aimed at future-you (and any engineer who joins).

---

## TL;DR

- **Stack:** Next.js 14 (App Router) → Supabase (Postgres + Auth + Storage + Realtime) → Stripe Connect.
- **Compliance posture:** Free-tier Supabase for MVP, plan to upgrade to **HIPAA tier** before launch. Schema is HIPAA-aware (audit log, encryption flags, PHI isolation) but enforcement is deferred.
- **Marketplace, not staffing.** All CNAs are 1099. We don't employ them; we don't run training; we don't bill insurance directly *yet*.
- **40 tables, every one with RLS.** The database refuses to leak data even if app code has bugs.

---

## Domains

The schema breaks into seven domains:

```
                    ┌────────────────┐
                    │   IDENTITY     │
                    │  users         │
                    │  client_pro... │
                    │  cna_profiles  │
                    │  care_recip... │
                    └────────┬───────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
┌──────▼──────┐      ┌───────▼────────┐    ┌──────▼──────┐
│ MARKETPLACE │      │   PAYMENTS     │    │  MESSAGING  │
│ jobs        │      │ payments       │    │ threads     │
│ applications│◄────►│ payment_methods│◄──►│ messages    │
│ bookings    │      │ refunds        │    │             │
│ shifts      │      │ fee_config     │    │             │
└─────┬───────┘      └────────────────┘    └─────────────┘
      │
      ├──────────────────┐
      │                  │
┌─────▼──────┐    ┌──────▼─────┐
│  REVIEWS   │    │  TRAINING  │
│  reviews   │    │  partners  │
│  favorites │    │  cohorts   │
└────────────┘    │  referrals │
                  └────────────┘
      ┌────────────────┐
      │   B2B (v2)     │
      │  organizations │
      │  business_shi..│
      │  invoices      │
      └────────────────┘
```

---

## Identity & roles

Supabase Auth manages `auth.users`. We mirror selected fields into `public.users` via the `handle_new_user()` trigger so we can foreign-key against it. The trigger reads `raw_user_meta_data.role` so signup forms pass `{ role: 'cna' }` at signup.

Roles: `client` (default) | `cna` | `business` | `admin`.

**Why mirror?** Two reasons:
1. Foreign keys can't reference `auth.users` directly from policies in some Supabase setups.
2. We need our own `role`, `status`, app-level fields that don't belong in the auth schema.

### PHI separation

`care_recipients` is the only place with patient health information (conditions, medications, allergies). The client (family member) owns it; CNAs read it **only** when they have an active booking against that recipient.

Once we move to HIPAA tier, the conditions/medications/allergies columns should be encrypted at column level using `pgp_sym_encrypt`. That migration is straightforward — change column types to `bytea` and add a wrapper view that decrypts for authorized reads.

---

## CNA profile model

A CNA's data is spread across multiple tables for normalization and querying:

- `cna_profiles` — public-facing card data (display name, photo, hourly rate, tier, ratings)
- `cna_services` — many-to-many with `service_taxonomy`
- `cna_verifications` — one row per credential (CPR, BG check, etc.)
- `cna_service_areas` — optional polygon-drawn coverage area
- `cna_availability` — recurring weekly schedule
- `cna_availability_overrides` — one-off blackouts or extra availability

**Tier rules** (auto-promoted by the `cna_check_tier_promotion()` trigger after each completed shift):
- `new` — default
- `verified` — Level 2 BG check passed
- `top_rated` — 10+ completed shifts AND rating average ≥ 4.5

Tier drives both **visibility** (sort order on Browse) and **platform fee** (15% / 12% / 10%).

### Geo-matching

CNAs anchor their service area at `(service_lat, service_lng)` with `service_radius_miles`. The `miles_between()` helper uses the `earthdistance` extension for fast proximity queries (no PostGIS needed for v1). A GIST index on `ll_to_earth(lat, lng)` keeps it fast.

If we need true polygon containment later (e.g. "is this address inside the CNA's drawn service area?"), we'll add PostGIS and migrate `polygon_geojson` to `geometry`.

---

## Marketplace flow

```
1. Client posts JOB
       │
       ▼
2. CNAs see it in their feed (matched by zip + services + radius)
       │
       ▼
3. CNAs submit JOB_APPLICATIONS
       │
       ▼
4. Client shortlists, messages, picks one
       │
       ▼
5. Accepted application → BOOKING is created
       │
       ▼
6. Each visit logged as a SHIFT (clock-in, clock-out, GPS)
       │
       ▼
7. Shift completes → PAYMENT released → REVIEW prompt
```

Direct bookings (skip the job/application steps) are supported — `bookings.job_id` is nullable.

### Why a separate `shifts` table?

A booking is a contract; a shift is a delivery. One booking ("3 visits per week for 6 months") yields many shifts. Each shift has its own clock-in/out, GPS coordinates, status, and payment. The same shifts table will double as our **EVV record** when Medicaid is enabled.

---

## Payments — Stripe Connect

We use the **destination-charge** model:

1. Client pays Kindred (we're the merchant of record).
2. Funds sit in our Stripe balance (escrow).
3. When a shift transitions to `completed`, we create a `transfer` to the CNA's Connected Express account, net of platform fee.
4. Stripe sends payouts to the CNA's bank on their normal schedule.

All amounts are stored as **integer cents** to avoid floating-point drift. The `payments` table has a `CHECK` constraint enforcing `gross = platform_fee + cna_payout + stripe_fee` — the schema literally won't accept inconsistent rows.

Platform fee % is read from `platform_fee_config` (single-row config table) so we can change tiers without redeploying. Default values match Open Question Q2:
- new: 15%
- verified: 12%
- top_rated: 10%

---

## Messaging — HIPAA-aware design

Two-party threads (v1). The schema has a `participant_a < participant_b` CHECK constraint that normalizes thread identity — so (Alice, Bob) and (Bob, Alice) can't both exist.

**Important pre-HIPAA caveat:** `messages.body` is plain text right now. When we upgrade to HIPAA tier:
1. Add a `body_encrypted bytea` column.
2. Encrypt on insert with `pgp_sym_encrypt(body, key)`.
3. Drop or null the plain `body` column.
4. Add a decryption view restricted to participants.
5. Log every decryption call in `audit_log`.

That migration is mechanical — schema is already structured to support it.

---

## Reviews & tier promotion

Reviews are mutual but one-way visible in v1 (Airbnb-style 14-day double-blind period is a v2 enhancement).

Two triggers do the heavy lifting:

1. **`reviews_update_cna_aggregates()`** — recomputes `cna_profiles.rating_avg` and `rating_count` whenever a review is inserted/updated/deleted.
2. **`cna_check_tier_promotion()`** — runs when a shift transitions to `completed`. Increments `completed_shifts_count` and promotes tier if criteria are met.

This means **app code never has to compute these aggregates manually** — they stay correct via the database, no race conditions.

---

## Training partner liaison model

We don't run CNA training. We **refer** aspiring CNAs to local certification schools and collect a fee.

The schema supports three payment models — set per-partner:

| Model | How money flows | When to use |
|---|---|---|
| `flat_fee` | School pays us flat $ per enrollment, invoiced monthly | Simplest. Use when school has billing ops. |
| `kindred_checkout` | Student pays Kindred at checkout; we remit to school | Best for student-side incentive offers. Requires receivables work. |
| `affiliate` | Affiliate-link tracking; school invoices us | Use for schools who already have their own checkout. |

The `training_referrals` table allows `user_id` to be NULL so we can capture leads from someone filling out the "find me a school" form before they have a Kindred account.

---

## B2B / Business portal

**Schema-only in v1.** No routes, no UI. The tables are in place because adding them later costs more than building them now alongside the consumer schema.

Key design decisions:
- B2B uses the **same `cna_profiles` pool** as the consumer side (Open Q14).
- Business shifts are in a **separate `business_shifts` table** from consumer `jobs` because the flow is fundamentally different (post-and-assign, not post-and-receive-applications).
- Facility billing is **monthly net-30** (`invoices` table), not per-shift escrow.
- A 28% default markup on bill-rate vs pay-rate (Open Q12, model A).

**Target sequencing** (from spreadsheet Open Q11/Q13): consumer marketplace → first 50 successful bookings → ALFs → memory care → SNFs → hospitals.

---

## Row Level Security

Every public table has RLS enabled. Default-deny — no policy means no access.

**Helper functions** (all `SECURITY DEFINER`, `search_path` pinned to `public`):
- `is_admin(uuid)` — does this user have role='admin'?
- `current_user_role()` — what role does the current `auth.uid()` user have?
- `is_org_member(org_id, user_id)` — used for B2B policies

These helpers had their EXECUTE grants revoked from `anon`/`authenticated` after a security advisor warning — they're called inside policies (which run as the function owner), not via `/rpc` directly.

### Notable policies

- **`care_recipients`** — owners + assigned CNAs (during active booking) + admins. Most restrictive table.
- **`cna_profiles`** — public read (drives Browse). Sensitive fields (last name, exact contact) are hidden in the app layer for anonymous users.
- **`messages`** — sender or recipient only. Message body is currently plaintext (pre-HIPAA).
- **`payments`** — both parties + admin. Writes only via service-role (Stripe webhooks).
- **`audit_log`** — admin read only. Inserts via service-role.
- **B2B tables** — `is_org_member()`-gated.

---

## Roadmap: HIPAA + Medicaid

The user explicitly said: **Medicaid billing is part of v1 scope**. The schema is ready; the *wiring* is deferred until vendor decisions land. Here's what needs to happen pre-launch:

### Phase 1: HIPAA tier upgrade (~$599/mo Team plan + add-on)
- [ ] Upgrade Supabase project to Team plan
- [ ] Enable HIPAA add-on, sign Supabase BAA
- [ ] Encrypt `care_recipients` PHI columns (conditions, medications, allergies)
- [ ] Encrypt `messages.body` (move to `body_encrypted bytea`)
- [ ] Implement audit-log writes on every PHI read (currently structural only)
- [ ] Configure backups (Supabase Team includes daily backups + 7-day PITR)
- [ ] Enable MFA enforcement on all CNA accounts

### Phase 2: Medicaid billing (any one of these vendors)
- [ ] **Pick an EVV vendor** — Tellus (most FL-popular) vs HHAeXchange vs Sandata
- [ ] Pick a **clearinghouse** — Office Ally (cheapest) vs Availity (FL Medicaid native) vs Change Healthcare
- [ ] **Enroll as a Medicaid provider** in FL (NPI required; we'll need a Type 2 Org NPI)
- [ ] Sign BAAs with each vendor
- [ ] Implement EVV submission: when a `shift` transitions to `completed` AND `bookings.payer_type='medicaid'`, fire `evv_submitted_at` push
- [ ] Implement claim generation: EDI 837 from completed shifts; submit through clearinghouse
- [ ] Wire remittance ingestion: EDI 835 from clearinghouse → update `payments` rows

### Phase 3: Identity-proofing
- [ ] Add Stripe Identity verification to CNA onboarding (live photo + government ID)
- [ ] Add address verification (USPS API or similar)

---

## Storage

Four buckets:

| Bucket | Public? | Folder convention |
|---|---|---|
| `kindred-avatars` | Yes | `<user_id>/<filename>` |
| `kindred-documents` | No | `<user_id>/<doc_id>.<ext>` |
| `kindred-job-attachments` | No | `<user_id>/<attachment_id>.<ext>` |
| `kindred-public` | Yes | (admin-managed via service role) |

The bucket policies enforce the folder convention — clients can only upload to a folder named after their own user ID. This means a malicious client can't upload into someone else's folder even with a valid auth token.

Public buckets allow **individual object reads** but not bucket-listing — clients have to know the exact filename, they can't enumerate.

---

## What's intentionally *not* here in v1

- **Multi-language UI.** The spreadsheet mentions Spanish; we'll add i18n once core flows are stable.
- **In-app calling.** Phone numbers will be revealed after booking, no Twilio-mediated calls (yet).
- **Mobile app.** PWA-friendly Next.js for v1; React Native later.
- **Advanced search ranking.** Sort by tier + rating + distance is enough for MVP.
- **Reputation/badge system beyond tier.** Top-rated badge only; "10+ shifts," etc. badges come later.
- **Automated NCAS/L2 BG-check workflow.** Hooked into Checkr but the integration isn't wired yet.

---

## Files of interest

- `supabase/migrations/00011_row_level_security.sql` — security backbone, audit annually
- `supabase/migrations/00007_payments.sql` — money flow, never modify casually
- `lib/stripe/fees.ts` — keep in sync with `platform_fee_config` table values
- `app/auth/callback/route.ts` — role-based redirect logic

---

*Schema decisions reflect the build tracker as of the AFK session. Reconcile against the Master Checklist when in doubt.*
