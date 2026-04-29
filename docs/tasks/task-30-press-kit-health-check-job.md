# Task 30 — Press Kit Link Daily Health-Check Job

## Summary
Daily cron HEAD-checks every published profile's `pressKitUrl`; emails the DJ on 2 consecutive failures; auto-hides the public CTA after 3.

## PRD references
- §6.5 (Health monitoring), §18 risk #10.

## Dependencies
- task-15, task-08, task-23 (transactional email infra reused).

## Scope (in)
- Cron at 03:00 UTC daily.
- Sweep all `Profiles` where `status = 'published'` and `pressKitUrl IS NOT NULL`.
- HEAD request with 8s timeout; fall back to ranged GET if HEAD blocked.
- Update `pressKitLastCheckedAt` always; flip `pressKitHealthStatus` based on consecutive-fail counter.
- After 2 consecutive failures: send `press_kit_link_warning` email to the DJ + show yellow banner in dashboard.
- After 3 consecutive failures: hide the public CTA + send `press_kit_link_broken` email.
- On a successful check, reset the counter and remove the banner.

## Scope (out)
- Monitoring intermediate redirects deeply (we only care about final status).
- Real download verification (we cannot fetch the bytes from external hosts).

## Acceptance criteria
- [ ] Cron runs reliably at the scheduled time on production.
- [ ] Test fixtures with known-broken URLs flip to `broken` after exactly 3 failures.
- [ ] Email content is translated per the DJ's preferred locale (task-29).
- [ ] CTA hide takes effect within the next ISR revalidation cycle.

## Implementation notes
- Run sequentially batched with a small concurrency (e.g. 10 parallel checks) to avoid hammering any single provider.
- Respect `robots.txt` is not relevant for HEAD; do respect rate limits for known providers (Google Drive can throttle).

## Definition of Done
Per Appendix C.
