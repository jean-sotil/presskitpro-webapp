# Task 24 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-24-analytics-pipeline.md](./task-24-analytics-pipeline.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Task-24 lights up the first **artist-facing measurement loop** — DJs convert because they can see the kit working. Three architectural firsts get exercised:

1. **First fire-and-forget write path.** Public profile renders are ISR-cached, so any write must not block TTFB. `/api/track` accepts, returns 204, then writes asynchronously.
2. **First non-Payload table.** Analytics events are a write-mostly stream — Payload's hooks/access/types layers are pure overhead. Raw events live in Supabase Postgres, written by a thin Supabase service-role client.
3. **First privacy-preserving identity scheme.** Cookie-less unique counting via daily-rotating salt + IP+UA hash — never persistable to a real visitor, never crosses a UTC date boundary.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Storage | New tables in **Supabase `public` schema**, not Payload. Same migration tooling as `slug_reservations` / `slug_redirects`. | Fire-and-forget, no relational hooks, dashboard reads pre-rolled rows. |
| 2 | Tables | `analytics_events` (raw, partitioned-by-day-friendly), `analytics_daily_rollups` (per-profile/event/day), `analytics_salts` (one row per UTC date). | Matches PRD §7 `analytics_events`. Rollup table backs the dashboard. Salt table decouples key rotation from deploys. |
| 3 | Capture A — `page_view` | Next.js middleware fires on every public profile request. Beacons a `page_view` to `/api/track` with `keepalive`. Works for JS-disabled visitors. | Spec says "server-side event capture via middleware". The route is ISR-cached but middleware runs on every request. |
| 4 | Capture B — clicks | Existing `track()` shim in `lib/analytics/track.ts` swaps its dev console-debug sink for `navigator.sendBeacon('/api/track', ...)` in the browser. Click components (`TrackedPressKitAnchor`, new `TrackedContactCta`, new `TrackedSocialLink`) call `track()`. | The shim already exists and is wired into `TrackedPressKitAnchor`. Reuse, don't reinvent. |
| 5 | Salt scheme | `analytics_salts` row holds today's salt as `bytea`. The daily cron writes tomorrow's salt at 23:50 UTC. The /api/track route reads today's salt (LRU-cached for the request lifetime). Hash = SHA-256(salt ‖ ip ‖ ua), truncated to 16 bytes. | Rotates without redeploys; same posture as the `CRON_SECRET` we just landed for task-23. |
| 6 | Daily rollup cron | `POST /api/cron/analytics`, gated by `CRON_SECRET`. Aggregates yesterday's `analytics_events` into `analytics_daily_rollups` (profile_id, event_type, day, count, unique_count). Idempotent — `(profile_id, event_type, day)` unique constraint with upsert. | One endpoint, hourly cadence is fine (rollups are append-only over closed days). |
| 7 | Top-N referrers | Stored as a JSONB column on the rollup row (`top_referrers: [{ host, count }]`) — top 5 per profile per day. Dashboard reads the latest 14 rows and merges. | Avoids a second table; query is a single `SELECT … WHERE day BETWEEN …`. |
| 8 | Dashboard chart | Server-rendered inline SVG inside an RSC. 14 bars, native `<title>` tooltip. No client lib. | Spec mandates "<300ms server-side, low client JS budget". |
| 9 | Press-kit click parity | Click events use `sendBeacon` (existing call site). 1% drift target met with no redirect rewrite. | Plan-doc Default II. Preserves middle-click "copy link"; no SEO-affecting redirects. |
| 10 | Out of scope | Country geo beyond `Accept-Language` (deferred). Cohort/funnel analysis (task-28 PostHog server-side). Sampling for high-volume profiles (out — none yet). | Spec scope-out. |

## Cross-references

- PRD §6.7 (artist analytics), §7 (`analytics_events` shape), §15 (privacy posture), §18 risk #5 (PII in events).
- task-08 (Payload collections), task-19 (public profile route), task-23 (cron + `CRON_SECRET` pattern, just landed).
- task-28 (server-side PostHog product analytics; uses the same `track()` shim with a different sink).

## File inventory

### Schema (Supabase migration)
- `supabase/migrations/<ts>_task_24_analytics.sql` — three tables + RLS policies (service-role only). Includes the daily-day index on `analytics_events.occurred_at`.

### Pure helpers (TDD)
- `lib/analytics/hash-visitor.ts` (+ test) — `hashVisitor({ ip, userAgent, salt })` → 16-byte hex string. Deterministic, salt-required.
- `lib/analytics/derive-event.ts` (+ test) — `deriveEvent({ url, referrer, headers })` → `{ profileSlug, referrerHost, locale }`. Pulls slug from URL path, normalizes referrer to host-only (no PII path components), reads `Accept-Language`.
- `lib/analytics/aggregate-rollup.ts` (+ test) — pure `aggregate(events, day)` → `RollupRow[]`. Inputs are raw events for a UTC day; output is the upsert payload. Lets the cron be tested without the DB.
- `lib/analytics/format-chart.ts` (+ test) — pure `formatChart(rows)` → `{ days[14], maxCount, bars[] }` for the SVG. Empty days are zero-filled.

### Service-role client + sink
- `lib/analytics/supabase-events.ts` — thin write client (insert into `analytics_events`, upsert into `analytics_daily_rollups`, read salt). Uses `supabaseAdmin()`.
- `lib/analytics/server-sink.ts` — node-side `track()` sink (used inside server components / actions when present).
- `lib/analytics/browser-sink.ts` — registered once in `app/[slug]/layout.tsx`-equivalent or a tiny `<AnalyticsClient>` snippet on the public profile. Calls `navigator.sendBeacon('/api/track', JSON.stringify(...))`.

### Capture endpoints
- `app/api/track/route.ts` — POST handler. Validates body shape, derives visitor hash, inserts into `analytics_events`, returns 204. Body size capped; rate-limit at the edge by event-type quota per IP/minute (defer to task-27).
- `middleware.ts` — extend matcher to include `/[slug]` patterns. On a profile request, fire-and-forget POST to `/api/track` with `event=page_view`. Skip when `/_next`, `/api`, etc. — same matcher exclusions as today, plus skip `/dashboard`, `/onboarding`, `/login`, `/signup`, `/admin`, `/checkout`, `/pricing`.

### Cron
- `app/api/cron/analytics/route.ts` — POST gated by `CRON_SECRET`. Computes yesterday's rollup, writes salt for tomorrow.

### Dashboard
- `app/dashboard/analytics/page.tsx` — RSC. Reads rollups for owner's profiles, server-renders chart + top-referrers list. Routes from existing dashboard with a new "Analytics" link.
- `components/dashboard/AnalyticsChart.tsx` — pure server component, takes `formatChart` output. Inline SVG. Includes a screen-reader-friendly `<table>` fallback.
- `components/dashboard/TopReferrers.tsx` — pure list component, top-5 referrers across the 14 days.

### Click capture
- `components/profile/sections/TrackedContactCta.tsx` — wraps the public contact CTA buttons (WhatsApp / email). Fires `contact_click` with `{ channel, profileSlug }`.
- `components/profile/sections/TrackedSocialLink.tsx` — wraps SocialLinkRender's `<a>`. Fires `social_click` with `{ platform, profileSlug }`.
- Update `lib/analytics/track.ts` event union: add `page_view`, `contact_click`, `social_click`.

### Env
- `.env.example` — `ANALYTICS_BEACON_DISABLED` (test toggle), no new secrets (CRON_SECRET reused).

### E2E + runbook
- `tests/e2e/analytics-capture.spec.ts` — `@smoke`: visit a published profile, assert /api/track was hit (route stub). `@full`: end-to-end against a real Supabase project, asserts a row appears.
- `docs/runbooks/dev-editor.md` — append "Test the analytics pipeline" recipe.

## Implementation sequence

1. **Plan doc** (this).
2. **Supabase migration** — three tables + indexes + RLS.
3. **Pure helpers (TDD)** — hash-visitor, derive-event, aggregate-rollup, format-chart.
4. **Service-role write client + read functions.**
5. **`/api/track` route** with body validation + visitor hashing.
6. **Middleware extension** — page-view beacon on `/[slug]` requests.
7. **Browser sink + click components** (`TrackedContactCta`, `TrackedSocialLink`); update `track()` event union; replace existing dev sink default with `browserSink` when in browser.
8. **Wire components into the public profile** — replace bare contact CTAs and social-link anchors.
9. **Daily-rollup cron route.**
10. **Dashboard analytics page** — chart + top referrers.
11. **E2E + runbook.**
12. **Verification (typecheck + tests).**

## Acceptance evidence

| AC | How verified |
|---|---|
| No tracking cookies on visitors | The /api/track route does not return Set-Cookie. The middleware page-view beacon does not set cookies. Verified by route test asserting headers; e2e asserts `document.cookie` is empty post-load. |
| Fire-and-forget — does not delay TTFB | The middleware uses `fetch(..., { keepalive: true }).catch(() => {})` without await on the response body. The route returns 204 immediately after enqueuing the insert. |
| Dashboard chart <300ms server-side | The dashboard page reads only `analytics_daily_rollups` (≤ 14 rows × N profiles). Indexed by `(profile_id, day)`. SSR timing logged in dev console. |
| Press-kit click counts ±1% of redirect logs | Click capture is `sendBeacon`-based, same path as existing `TrackedPressKitAnchor`. 1% drift is the JS-disabled minority. |

## Test plan

- **Unit:** hash-visitor (deterministic, rotates with salt, distinct UAs ≠ same hash); derive-event (slug parsing, referrer host normalization, locale fallback); aggregate-rollup (no events, single profile, multi-event/day, top-N referrers); format-chart (zero-fill, max scaling, RTL-safe day labels).
- **Route:** /api/track (rejects oversize body, rejects unknown event, valid event lands in DB via mock client); /api/cron/analytics (401 without secret, idempotent on re-run).
- **E2E:** `@smoke` — public profile visit triggers /api/track POST; dashboard analytics page renders 14 bars without throwing. `@full` — same but asserts the row in Supabase.

## Out of scope

- IP geo enrichment beyond `Accept-Language` (deferred; PRD §15 notes ipinfo.io as future).
- Sampling for high-volume profiles (defer; v1 has zero high-volume profiles).
- PostHog wiring for product events (`onboarding_completed`, etc.) — task-28.
- Real-time dashboard (we read pre-rolled snapshots; rollup cadence is daily).
- Per-event rate limiting beyond what middleware naturally absorbs — task-27 owns abuse posture.

## Risks

- **R1 — Middleware fires on cached pages.** ISR returns the same HTML to many requests; the middleware page-view fires on every request even when the page comes from cache. *Mitigation:* this is exactly what we want — we count requests, not cache misses. Document in the runbook so nobody "fixes" it.
- **R2 — Supabase write fails under load.** A bad upstream blocks /api/track. *Mitigation:* the route catches and returns 204 anyway; failures are logged via console and surface in task-28's Sentry once that lands. Analytics is best-effort by contract.
- **R3 — Bot traffic skews counts.** Crawlers visit profile pages and inflate `page_view`. *Mitigation:* middleware checks `User-Agent` against a small denylist (`Googlebot`, `Bingbot`, etc.) before beaconing. False negatives are acceptable for v1.
- **R4 — Salt rotation gap.** The cron misses a day; the same salt covers two UTC days, narrowing the unique-visitor fence. *Mitigation:* the route checks `analytics_salts.day = today_utc` and inserts a new salt on miss (`ON CONFLICT DO NOTHING`). Self-healing without ceremony.
- **R5 — PII leakage in `referrer` URLs.** Some referrers carry path-level PII (Google search query). *Mitigation:* `derive-event.ts` keeps host only — never path or query string. Tested.

## Done when

1. Three Supabase tables created; types regen clean (no Payload changes).
2. Pure helpers TDD green.
3. `/api/track` accepts a beacon, writes a row, returns 204; rejects malformed bodies.
4. Public profile page-views land in `analytics_events` via middleware (verified by tail-log on dev).
5. Existing press-kit click and new contact/social click events all land via the same `track()` path.
6. Daily-rollup cron returns 401 without secret; with secret, populates `analytics_daily_rollups` idempotently.
7. `/dashboard/analytics` renders a 14-day SVG chart + top-5 referrers list for the owner's profiles. Server-side timing under 300ms in dev.
8. `bun run test` + `bun run typecheck` green; e2e `@smoke` green.
9. Plan file (this doc) committed alongside implementation.
