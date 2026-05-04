# Graph Report - .  (2026-05-04)

## Corpus Check
- Corpus is ~22,108 words - fits in a single context window. You may not need a graph.

## Summary
- 257 nodes · 315 edges · 32 communities (28 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.84)
- Token cost: 172,537 input · 43,134 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Quality, A11y & Theming|Quality, A11y & Theming]]
- [[_COMMUNITY_Onboarding & Schema Model|Onboarding & Schema Model]]
- [[_COMMUNITY_Auth, RLS & Storage Backend|Auth, RLS & Storage Backend]]
- [[_COMMUNITY_Billing, Trials & Agency|Billing, Trials & Agency]]
- [[_COMMUNITY_Architecture Split Decisions|Architecture Split Decisions]]
- [[_COMMUNITY_i18n & V2 Backlog|i18n & V2 Backlog]]
- [[_COMMUNITY_Public Profile & SEO|Public Profile & SEO]]
- [[_COMMUNITY_Security & Embed Hardening|Security & Embed Hardening]]
- [[_COMMUNITY_Payload API Routes|Payload API Routes]]
- [[_COMMUNITY_Spike & README Foundations|Spike & README Foundations]]
- [[_COMMUNITY_Payload Config Wiring|Payload Config Wiring]]
- [[_COMMUNITY_Analytics & Observability|Analytics & Observability]]
- [[_COMMUNITY_Server-Side Singletons|Server-Side Singletons]]
- [[_COMMUNITY_App Root Layout|App Root Layout]]
- [[_COMMUNITY_Spike Upload Widget|Spike Upload Widget]]
- [[_COMMUNITY_Layout & Providers Setup|Layout & Providers Setup]]
- [[_COMMUNITY_Performance Budget|Performance Budget]]
- [[_COMMUNITY_Trial Expiration Cron|Trial Expiration Cron]]
- [[_COMMUNITY_PostCSS Config (semantic)|PostCSS Config (semantic)]]

## God Nodes (most connected - your core abstractions)
1. `PressKit.pro PRD v0.2` - 34 edges
2. `Task Index README` - 17 edges
3. `Data Model: Payload + Supabase Schema Split` - 16 edges
4. `Task 08 — Payload Collections (Data Model)` - 16 edges
5. `ADR-0001 Payload + Supabase Architecture Split` - 14 edges
6. `Task 34 — V2 Backlog (Stubs)` - 9 edges
7. `Task 09 — Profile Editor Shell` - 8 edges
8. `Task 02 — Supabase + Payload Architecture Spike` - 7 edges
9. `Task 19 — Public Profile Page (/{slug})` - 7 edges
10. `Task 23 — Stripe Trial → Paid Conversion` - 7 edges

## Surprising Connections (you probably didn't know these)
- `i18n/request.ts next-intl request config` --implements--> `Task 29 — i18n PT/EN with next-intl (cookie-based)`  [INFERRED]
  i18n/request.ts → docs/tasks/task-29-i18n-next-intl.md
- `POST()` --calls--> `supabaseAdmin()`  [INFERRED]
  app/api/storage/sign-upload/route.ts → lib/supabase/admin.ts
- `/api/webhooks/supabase-auth Next.js endpoint` --shares_data_with--> `Users collection`  [INFERRED]
  supabase/migrations/20260429000001_spike_storage_and_auth_webhook.sql → payload/collections/Users.ts
- `POST()` --calls--> `payload()`  [INFERRED]
  app/api/webhooks/supabase-auth/route.ts → lib/payload.ts
- `POST()` --calls--> `supabaseAdmin()`  [INFERRED]
  app/api/media/route.ts → lib/supabase/admin.ts

## Hyperedges (group relationships)
- **Signed-upload + Media register round-trip** —  [INFERRED 1.00]
- **Supabase Auth -> Payload User sync** —  [INFERRED 0.90]
- **Payload admin route group mount** —  [INFERRED 1.00]
- **Dual-schema architecture (PRD + ADR + spike + runbooks)** — data_model_payload_supabase_split, adr_0001_payload_supabase_split, task_02_supabase_payload_spike, runbook_migrations, runbook_dev_hosted_supabase [EXTRACTED 1.00]
- **Profile Editor Section Implementation Tasks** — task_09_profile_editor_shell, task_10_editor_section_hero, task_11_editor_section_bio_services, task_12_editor_section_photo_gallery, task_13_editor_section_social_links, task_14_editor_section_contact, task_15_editor_section_press_kit_link, task_16_editor_section_soundcloud_oembed [EXTRACTED 1.00]
- **Phase 0 Foundation Tasks** — task_01_project_setup, task_02_supabase_payload_spike, task_04_ci_cd_quality_gates [EXTRACTED 1.00]
- **Public profile page quality pillars (perf, a11y, SEO)** — task_19_public_profile_page, task_20_seo_foundation, task_25_a11y_baseline, task_26_performance_budget [INFERRED 0.85]
- **Trial → paid → paused → reclaimed lifecycle** — task_23_stripe_trial_to_paid, task_31_billing_annual_agency, task_32_slug_reclamation, task_22_pricing_page [INFERRED 0.85]
- **Privacy and LGPD compliance stack** — task_27_security_rls_rate_limits, task_33_lgpd_export_delete, task_24_analytics_pipeline, task_28_observability [INFERRED 0.75]
- **Supabase auth-to-Payload sync pipeline** — auth_users_table, trg_sync_auth_user, fn_sync_auth_user_to_payload, net_http_post, supabase_auth_webhook_endpoint, users_collection, users_supabase_user_id [INFERRED 0.85]
- **Spike storage buckets with public-read/auth-write RLS** — supabase_storage_avatars_bucket, supabase_storage_gallery_bucket, policy_public_read_avatars, policy_public_read_gallery, policy_auth_write_avatars, policy_auth_write_gallery, storage_objects_table [EXTRACTED 0.85]
- **User-owned resources (Users as ownership root)** — users_collection, profiles_collection, media_collection, profiles_owner_field, media_owner_field [INFERRED 0.85]

## Communities (32 total, 4 thin omitted)

### Community 0 - "Quality, A11y & Theming"
Cohesion: 0.06
Nodes (37): Accessibility WCAG 2.2 AA Requirements, Analytics & Monitoring (PostHog, Sentry), Appendix B — Locale Fallback Matrix, Appendix C — Definition of Done, Contrast Validation Gate at Save-time, Default Theme: Editorial Nightlife, Per-DJ Analytics Dashboard, ESM Constraint: Payload v3 requires type:module in package.json (+29 more)

### Community 1 - "Onboarding & Schema Model"
Cohesion: 0.14
Nodes (29): Appendix A — URL Slug Rules, Authentication & Onboarding, Data Model: Payload + Supabase Schema Split, 5-Step Onboarding Wizard, Payload Collection: FeaturedTracks, Payload Collection: InstagramConnections, Payload Collection: Media (reference-only), Payload Collection: ProfileContent (localized) (+21 more)

### Community 2 - "Auth, RLS & Storage Backend"
Cohesion: 0.1
Nodes (25): Admins collection, ADR 0001: Payload not managing storage, auth.users table (Supabase), function public.sync_auth_user_to_payload, Media collection, Media.owner relationship to users, net.http_post (pg_net), RLS policy: auth write avatars (+17 more)

### Community 3 - "Billing, Trials & Agency"
Cohesion: 0.12
Nodes (17): Agency profile switcher in dashboard nav, Consecutive-failure counter (warn at 2, broken at 3), Consolidated billing single Stripe customer multi-sub, HEAD check with ranged GET fallback, Inactivity = no login + no edit + no traffic > 30d AND no sub, No Supabase client until signup click, 14-day no-card trial; lazy Stripe Customer, Single config module with Stripe Price IDs (+9 more)

### Community 4 - "Architecture Split Decisions"
Cohesion: 0.19
Nodes (15): ADR-0001 Payload + Supabase Architecture Split, Authority of Identity: Supabase Auth canonical, Payload Users mirror, Media Reference-Only Inversion (signed URL upload), Payload Admins Collection (separate auth), Rejected: All-in on Payload (Auth + S3 adapter), Rejected: All-in on Supabase (skip Payload), Rejected: Two Separate Postgres Instances, Schema Isolation (schemaName: payload) (+7 more)

### Community 5 - "i18n & V2 Backlog"
Cohesion: 0.13
Nodes (15): i18n/request.ts next-intl request config, Cookie-based locale resolution (no path prefix), ICU MessageFormat plurals/dates/numbers, Locale fallback banner (Original in {language}), messages/{en,pt}.json CI key-parity check, Task 29 — i18n PT/EN with next-intl (cookie-based), Task 34 — V2 Backlog (Stubs), V2 — Agency Multi-Profile Dashboard (+7 more)

### Community 6 - "Public Profile & SEO"
Cohesion: 0.14
Nodes (14): axe CI zero critical/serious gate, Canonical URL without locale prefix, CSS-variable theme injection in <head>, hreflang alternates per locale + x-default, ISR with on-demand revalidation on Payload publish, JSON-LD MusicGroup/Person schema, Press kit is paused page (200 OK), Server component fetch via Payload Local API (+6 more)

### Community 7 - "Security & Embed Hardening"
Cohesion: 0.14
Nodes (14): CSP with nonces for inline theme <style>, Deletion fan-out to Payload/Supabase/Stripe/PostHog/Sentry, Intersection-triggered lazy iframe loading, Export ZIP via signed download link (24h), oEmbed server-side fetch with 24h cache, pgcrypto encryption of IG access tokens, Soft-delete immediate then hard-delete after 14d grace, RLS auth.uid() = user_id ownership policy (+6 more)

### Community 8 - "Payload API Routes"
Cohesion: 0.24
Nodes (6): payload(), POST(), POST(), supabaseAdmin(), constantTimeEqual(), POST()

### Community 10 - "Spike & README Foundations"
Cohesion: 0.29
Nodes (11): SpikePage, ADR-0001 reference, Hosted Supabase Dev Path, Environment Variables, PressKit Pro README, POST /api/media route, POST /api/storage/sign-upload route, POST /api/webhooks/supabase-auth route (+3 more)

### Community 11 - "Payload Config Wiring"
Cohesion: 0.22
Nodes (11): Payload admin importMap, Payload RootLayout wrapper, next.config.ts, Admin NotFoundPage, Admin RootPage, HomePage, payload.config.ts buildConfig, Payload generated Config (+3 more)

### Community 12 - "Analytics & Observability"
Cohesion: 0.33
Nodes (7): analytics_daily_rollups table for fast reads, Cookie-less unique-visitor counting via salted IP+UA hash, PostHog scoped to dashboard/marketing only (privacy), navigator.sendBeacon for non-blocking analytics, Sentry tunnel option to dodge ad blockers, Task 24 — Per-Profile Analytics Pipeline, Task 28 — Observability: Sentry + PostHog + Status Page

### Community 13 - "Server-Side Singletons"
Cohesion: 0.38
Nodes (7): lib/payload.ts payload() singleton, lib/supabase/admin.ts supabaseAdmin() singleton, lib/supabase/browser.ts supabaseBrowser() singleton, server-only import guard, NEXT_PUBLIC_SUPABASE_ANON_KEY env var, SUPABASE_SERVICE_ROLE_KEY env var, NEXT_PUBLIC_SUPABASE_URL env var

### Community 16 - "Layout & Providers Setup"
Cohesion: 0.67
Nodes (3): RootLayout (app), Providers (React Query), tailwind.config.ts

### Community 17 - "Performance Budget"
Cohesion: 0.67
Nodes (3): AVIF + WebP image variants via Supabase Storage, Lighthouse-CI budget assertions block PRs, Task 26 — Performance Budget Enforcement

## Knowledge Gaps
- **90 isolated node(s):** `PressKit.pro Product`, `Pillars: SEO-first, i18n by default, WCAG 2.2 AA`, `Persona: The Working DJ`, `Persona: Promoter / Venue Booker`, `Persona: Agent / Manager` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PressKit.pro PRD v0.2` connect `Quality, A11y & Theming` to `Onboarding & Schema Model`, `Architecture Split Decisions`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `ADR-0001 Payload + Supabase Architecture Split` connect `Architecture Split Decisions` to `Quality, A11y & Theming`, `Onboarding & Schema Model`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Task 19 — Public Profile Page (/{slug})` connect `Public Profile & SEO` to `Billing, Trials & Agency`, `Security & Embed Hardening`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `PressKit.pro Product`, `Pillars: SEO-first, i18n by default, WCAG 2.2 AA`, `Persona: The Working DJ` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Quality, A11y & Theming` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Onboarding & Schema Model` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Auth, RLS & Storage Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._