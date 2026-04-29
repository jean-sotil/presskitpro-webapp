# Task 28 — Observability: Sentry + PostHog + Status Page

## Summary
Wire production observability so we know when things break and how users move through the funnel.

## PRD references
- §15 (Analytics & monitoring).

## Dependencies
- task-01.

## Scope (in)
- Sentry for Next.js (server + browser) and Payload (server) with source maps.
- PostHog for product analytics — funnel: `signup → first_publish → first_press_kit_click`.
- Important: PostHog runs **only** in the dashboard / marketing flows, **not** on public profile pages (per §15 privacy commitment).
- Status page (Better Stack or equivalent) at `status.presskit.pro`.
- Synthetic uptime checks: marketing landing, a known seeded profile, `/api/health`.
- Alerts to Slack / email on Sentry P0 events and uptime drops.

## Scope (out)
- Custom incident-management runbooks (drafted later).

## Acceptance criteria
- [ ] An intentional thrown error in staging surfaces in Sentry within 30s with a usable stack.
- [ ] PostHog funnel report renders the signup → first publish path for the seeded test users.
- [ ] No PostHog/Sentry network calls fire from a public profile page (verified in DevTools).
- [ ] Status page reflects synthetic check results within 5 minutes.

## Implementation notes
- Use Sentry's `tunnel` option to dodge ad blockers (only for the dashboard / marketing surfaces).
- PostHog initialization gated on a route check; never bundled into the public profile route.

## Definition of Done
Per Appendix C.
