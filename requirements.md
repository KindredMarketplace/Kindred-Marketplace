---
title: Kindred App Requirements
type: spec
status: living
created: 2026-11-05
tags: [build, spec, requirements]
---

# Kindred App: Requirements

> Written 2026-11-05 from the vault (Mission, Quad Nursing Debrief, Master Checklist §17, landing page, principles). The kickoff interview was skipped because Nick was away and the vault already answers it. Anything still undecided is marked **OPEN** and has a safe default so the build doesn't stall.

## 1. Introduction

Kindred Marketplace LLC is building a Florida-first (Gainesville launch) platform where private-pay families find, vet, talk to and hire independent home caregivers (CNAs, home health aides, LPNs/RNs doing home care) directly.

**Kindred is a platform, not an employer.** The family employs the caregiver. Kindred does not set rates, take a cut of care fees, pay caregivers, pay mileage, give benefits, geo-track, keep care documentation, or bill insurance. Kindred's job is the connection. It earns money by selling **access**: a one-time startup fee plus a small monthly membership.

The product is the **vetting bar** (the Kindred Standard). Every listed caregiver has:
- a Level 2 background check
- ID verification
- their own liability insurance
- at least 1,500 hours of hands-on experience
- a passed personal interview with Kindred

Before paying, anyone can browse the real platform in a **locked preview**: real caregivers (or real job posts), with names, photos and contact details withheld at the data layer.

Launch target: **~Jan 24, 2027** (90 days from the 2026-10-26 platform reset). It ships as a web app that installs to the phone home screen (PWA). Native app-store wrappers come later (see the implementation plan).

The B2B facility portal, CNA training pipeline, Medicaid/insurance billing and Stripe Connect payouts are **out of scope**.

## 2. Glossary

| Term | Meaning |
|---|---|
| Family / client | The person who needs care, or a relative arranging it. They are the caregiver's employer. Role `client`. |
| Caregiver | An independent CNA, HHA, LPN or RN. Role `cna` in the database. Marketing copy says "caregiver" / "home health worker". |
| Kindred Standard | The minimum bar to be listed: L2 background, ID verified, own liability insurance, 1,500+ hours, passed interview. |
| Listed | A caregiver who meets the Kindred Standard **and** has an active membership. Only listed caregivers show up to families. |
| Membership | Paid access. Startup fee + monthly fee. Statuses: `active`, `comped`, `past_due`, `canceled`, `none`. |
| Founding caregiver | One of the first 25 approved caregivers. Gets a free year (startup fee waived). Afterwards pays only the monthly fee. |
| Locked preview | Browse mode for non-members. Real data, identity and contact withheld by the server, never just blurred with CSS. |
| Connection | A family and caregiver who are linked by a message thread, a job application or a booking. Connected people can always see each other's names. |

## 3. Requirements

### R1. Installable app
As a family member or caregiver, I want Kindred on my phone's home screen like any other app, so that I can check messages and jobs quickly.
1. THE System SHALL serve a web app manifest with name "Kindred", the K mark icon (192, 512, maskable) and `display: standalone`.
2. THE System SHALL register a service worker that serves an offline page when the network is down, and SHALL never cache authenticated HTML or API responses.
3. THE System SHALL include Apple touch icon and theme-color meta so iOS "Add to Home Screen" looks native.
4. THE portal layouts SHALL be usable at 375px width with no horizontal scroll.

### R2. Brand
1. THE System SHALL use the K Kindred mark everywhere the logo appears. The retired heart mark SHALL NOT appear anywhere.
2. Site metadata SHALL use the tagline "A better way to connect."
3. Copy SHALL NOT claim a service fee on care, Medicaid/insurance billing, B2B staffing or CNA training pathways.

### R3. Kindred Standard (vetting)
As a family, I want to know exactly what "vetted" means, so that I trust who comes into my home.
1. THE System SHALL store each caregiver's experience hours and verification records for: Level 2 background (`l2bg`), ID (`identity`) and liability insurance (`insurance`).
2. THE System SHALL compute "meets the Kindred Standard" on the server, as all of: `application_status = 'approved'`, `experience_hours >= 1500`, and `l2bg`, `identity` and `insurance` verified and not expired.
3. THE System SHALL publish a public `/kindred-standard` page listing the bar in plain language.
4. Caregivers SHALL see their own progress against each item.
5. Admins SHALL be able to mark each item verified or rejected, with an expiry date.

### R4. Membership (paid access)
As Kindred, I want to charge for access, not for care, so that I stay a platform and not an agency.
1. THE System SHALL store one membership per user, with status, plan, founding flag, period end and Stripe IDs.
2. THE System SHALL treat a user as a member only when status is `active` or `comped` and the period end is null or in the future.
3. Prices SHALL come from an `access_plans` table, not code. Defaults: caregiver $100 startup + $20/month; family $100 + $20/month (**OPEN**, see §4).
4. THE System SHALL take payment through Stripe Checkout (subscription mode, startup fee as a one-time line item). Kindred never touches money between family and caregiver.
5. When a caregiver is approved and fewer than 25 founding slots are used, THE System SHALL automatically grant a founding membership (comped, 1 year, startup fee waived).
6. Stripe webhooks SHALL keep membership status in sync (completed checkout, subscription updated, subscription deleted, invoice payment failed).
7. If Stripe keys are missing, THE System SHALL show "Memberships open at launch" instead of erroring. Admins can comp a membership by hand.

### R5. Locked preview
As a family who hasn't paid, I want to see real caregivers near me before I pay, so that I know what I'm buying.
1. Non-members (including logged-out visitors) SHALL be able to browse listed caregivers: first initial only, headline, bio, rate, years, experience hours, languages, service ZIP, availability and Kindred Standard badges.
2. For non-members THE System SHALL NOT return last name, full first name, photo, license number or any application data. This SHALL be enforced in the database (security-definer function plus RLS), not the UI.
3. Members (and anyone already connected to that caregiver) SHALL see the full first name, last name and photo.
4. Messaging a caregiver or posting a job SHALL require a membership. Non-members get a clear "Unlock with membership" path.
5. Caregivers who aren't members SHALL see open jobs with city/ZIP only (no street address). Applying to a job SHALL require being listed.
6. Anonymous users SHALL NOT be able to read `cna_profiles` rows directly.

### R6. Scope cleanup
1. Business portal routes SHALL be removed from the app (code archived in the repo, not deleted).
2. `/become-a-cna`, `/training-partners`, `/insurance-billing` and `/for-business` SHALL redirect to the closest current page.

### R7. Build health
1. `npm run type-check` and `npm run build` SHALL pass with zero errors.
2. Database types SHALL be generated from the live schema.

## 4. Open questions (with defaults)

| # | Question | Default used in code | Owner |
|---|---|---|---|
| Q1 | Do families pay, or only caregivers? How much? | Families: $100 + $20/mo in `access_plans`, editable without a deploy | Nick |
| Q2 | Free trial on top of the locked preview? | No trial. Locked preview only | Nick |
| Q3 | Attorney answer on platform vs nurse registry (FL s. 400.462) | Stay self-serve: families search and choose, Kindred never hand-matches | Nick + attorney |
| Q4 | BG check / ID vendor | Manual admin verification of uploaded docs | Nick |
| Q5 | Does the founding year start at approval or at launch? | At approval | Nick |
