# Task 24 — Per-Profile Analytics Pipeline

## Summary
Capture events on the public profile (page views, press kit clicks, contact CTA clicks, top referrers) and surface them on the dashboard as a 14-day rolling chart.

## PRD references
- §6.7 (Analytics for the DJ), §15 (Analytics & monitoring), §7 (`analytics_events`).

## Dependencies
- task-08, task-19.

## Scope (in)
- Server-side event capture via Next.js middleware + a thin API route (`/api/track`).
- Cookie-less unique-visitor counting (daily resolution; salted IP+UA hash rotated daily).
- Events: `page_view`, `press_kit_click`, `contact_click`, `social_click`.
- Dashboard chart (14-day rolling) using a server-rendered SVG or a tiny lib (e.g., visx) — keep client JS budget low.
- Daily aggregation cron writes to `analytics_daily_rollups` for fast dashboard reads.
- Top-5 referrers list on the dashboard.

## Scope (out)
- Cohort analysis, funnels (handled by PostHog server-side from product analytics — task-28).
- Country breakdown beyond what `Accept-Language` + IP geo gives us cheaply.

## Acceptance criteria
- [ ] No tracking cookies set on visitors (privacy-friendly per §15).
- [ ] Analytics request is fire-and-forget — does not delay public page TTFB.
- [ ] Dashboard chart renders in <300ms server-side.
- [ ] Press kit click counts match the redirect logs ±1% over a 24h window.

## Implementation notes
- Use `navigator.sendBeacon` from the public page for non-blocking sends.
- Salt the IP+UA hash with a key that rotates daily — gives uniqueness without persistent identity.

## Definition of Done
Per Appendix C.
