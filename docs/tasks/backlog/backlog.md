# Task 34 — V2 Backlog (Stubs)

## Summary
Tracked here as one consolidated backlog. Each item gets promoted to its own `task-NN-*.md` when prioritized for a sprint.

## PRD references
- §17 V2 (post-launch), §18 row #2 (IG Graph API), §18 row #3 (SoundCloud beyond oEmbed), §16 (custom domains in v2).

## Items

### 34.1 Custom Domains
Allow DJs to map their own domain (e.g. `djname.com`) to their profile. SSL via Let's Encrypt or Cloudflare for SaaS. CNAME or A-record verification.

### 34.2 Instagram Graph API Auto-Sync
Replace task-17's manual oEmbed flow with OAuth-connected Instagram Business/Creator + linked FB Page → store long-lived token (encrypted, task-27) → server-side fetch every 6h → cache + render grid.

### 34.3 SoundCloud Custom Player
Beyond oEmbed: custom waveform player with branded styling. Only if users specifically demand it.

### 34.4 `/explore` Directory + Search
Public directory of profiles, with tags / location filters / featured carousel. Adds `/explore` route + search index.

### 34.5 Agency Multi-Profile Dashboard
Power-user dashboard for agencies managing 5–10 profiles: bulk publish, cross-profile analytics view.

### 34.6 Booking Inquiry Inbox
Persist contact-form submissions in DB; threaded inbox in dashboard with reply-via-email.

### 34.7 Spanish + French Locales
Extend task-29's foundation with `es` and `fr` translations.

### 34.8 Custom CSS Escape Hatch
Power-user feature: allow injecting custom CSS scoped to the profile's `<main>` region. Sandboxed parser + WCAG re-validation gate.

### 34.9 Public API
External REST/GraphQL API for embedding profile data on the artist's other websites.

## Definition of Done
Items here are not "done" — they are tracked. Promote to a numbered task file when scoped.
