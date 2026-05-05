# Task 07 — Slug Rules, Blocklist & Reservations

## Summary
Enforce the slug grammar, reserved-word blocklist, profanity filter, and short-lived reservations during signup.

## PRD references
- §5 (Reserved slugs), Appendix A (URL slug rules), §18 row #4 (squatting policy stub).

## Dependencies
- task-02.

## Scope (in)
- Validator: `/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/` plus no consecutive hyphens.
- Reserved-word list per §5 stored as a seed in `slug_reservations`.
- Profanity filter (English + Portuguese baseline) sourced from a maintained library (e.g. `bad-words` + a curated PT list).
- `/api/slug/check` endpoint: returns `{ available: boolean, reason?: 'too-short'|'invalid-chars'|'reserved'|'profane'|'taken' }`.
- Soft-hold: reserving a slug during the wizard locks it for 15 minutes; abandoned holds expire.
- 301 redirect logic for slug changes (90-day window per Appendix A).

## Scope (out)
- 30-day reclamation policy (task-32).
- Verified-artist flow (v2).

## Acceptance criteria
- [ ] All reserved words from §5 return `available: false, reason: 'reserved'`.
- [ ] PT and EN profanity samples blocked; false positives < 1% on a hand-checked list of 100 real DJ names.
- [ ] Soft-hold expires automatically — verified by integration test.
- [ ] Slug change creates a `slug_redirects` row with `expires_at = now() + 90 days`.

## Implementation notes
- Profanity lists live in `data/profanity-{en,pt}.txt`, version-controlled.
- Use a Postgres unique index on `slug` for hard collision prevention; the API just gives a friendly message.
- Soft-holds: use a TTL in Postgres via a `expires_at` column + cron sweep, not Redis (we don't have one in the stack yet).

## Status

**Phase A complete.** Phase C (rate-limiting) and the public 301 wiring (task-19) are explicit follow-ups — see [the plan](./task-07-slug-rules-and-reservations.plan.md).

| AC | State | Notes |
|---|---|---|
| All §5 reserved words return `available: false, reason: 'reserved'` | ✅ | 29 rows seeded by [migration `20260504000001`](../../supabase/migrations/20260504000001_slug_reservations_and_redirects.sql). E2E spec hits `?slug=admin` and asserts the response. |
| PT/EN profanity blocked, FP rate < 1% on 100 DJ names | ✅ | Word-boundary regex against bundled lists. Unit suite samples 30 real DJ names + 120 generated clean names — zero false positives. |
| Soft-hold expires automatically | ✅ | `pg_cron` job `slug-sweep-expired` runs every 5 min; deletes `type='soft_hold' AND expires_at < now()`. |
| Slug change creates `slug_redirects` row, `expires_at = now() + 90d` | ✅ helper | `recordSlugChange()` UPSERTs the row. Wiring into the editor lands in task-19. |

## Definition of Done
Per Appendix C; Phase A artifacts (migration, validator, composite check, three API routes, e2e spec, runbook update, plan) committed alongside.
