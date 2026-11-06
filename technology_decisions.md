---
title: Kindred Technology Decisions
type: spec
status: living
created: 2026-11-05
---

# Technology Decisions

These were already in place. This file records them so the build skills can read them.

| Area | Decision | Notes |
|---|---|---|
| Framework | Next.js **16.2.6**, App Router, server actions | Docs said 14. Next 16 makes `cookies()` / `headers()` async, so always `await` them. |
| React | 18.3.1 in package.json (Next vendors its own React for the app router) | Install with `npm install --legacy-peer-deps` |
| DB / Auth | Supabase project `fibrhkrdyadnuebwovac` (us-east-1) | Migrations in `supabase/migrations`, applied with Supabase MCP `apply_migration` |
| Supabase client | `@supabase/ssr` **0.12.7** + `@supabase/supabase-js` **2.118.0**, cookie API `getAll`/`setAll` | Upgraded 2026-11-05. The old 0.5.2 typed every table as `never`. |
| Types | `types/database.types.ts` generated from the live schema | Regenerate after every migration |
| Authorization | RLS on every table. Helper functions live in the `kindred_internal` schema. Security-definer functions for redacted reads. | |
| Payments | Stripe Checkout + Billing for Kindred's own membership only | Stripe Connect / escrow is **not** used (platform, not employer) |
| Styling | Tailwind 3.4, palette in `tailwind.config.js`, Fraunces / Inter / JetBrains Mono | Don't change the design system without direction |
| App delivery | PWA: `app/manifest.ts`, `public/sw.js`, apple-touch icons | A Capacitor wrapper for the App Store / Play Store is a later phase |
| Hosting | Vercel (app), Cloudflare (DNS; Pages for the static landing) | Planned: `app.kindredmarketplace.com` |
| Email | Resend (key pending) | |
| Maps | Google Maps Platform (key pending) | |
