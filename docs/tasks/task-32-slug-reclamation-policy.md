# Task 32 — Slug Reclamation Policy (30-Day Inactivity)

## Summary
Reclaim slugs from accounts that have been inactive (no logins, no profile edits, no analytics activity) for 30 days, with the safeguards from §18.

## PRD references
- §18 row #4, Appendix A.

## Dependencies
- task-23 (paused profile flow), task-07 (slug reservations).

## Scope (in)
- Inactivity definition: no successful login + no edits + no public profile traffic > 30 days, AND no active subscription.
- Day-23 warning email: "Your slug will be released in 7 days unless you act."
- Day-30 release: slug returns to the available pool; the old account remains intact (just slug-less) and can claim a new one anytime.
- Prior 90-day grace from task-23 takes precedence — paused-but-grace slugs are *not* reclaimed.
- Audit log row written for every reclaim event.

## Scope (out)
- Verified-artist exemption (v2).
- Manual admin override UI (admin panel sufficient for v1).

## Acceptance criteria
- [ ] Reclamation cron runs daily and processes the queue idempotently.
- [ ] An active paying user is never reclaimed, regardless of activity (subscription beats inactivity).
- [ ] Warning email links directly to a "Keep my slug" one-click action.
- [ ] Released slugs become available within 1 hour of the cron run.

## Implementation notes
- Inactivity check joins `auth.users.last_sign_in_at`, `profiles.updated_at`, and a recent `analytics_events` aggregate.
- Reclamation is reversible within 24h via admin panel — keep the slug on a "soft-released" state for one day before truly freeing it.

## Definition of Done
Per Appendix C.
