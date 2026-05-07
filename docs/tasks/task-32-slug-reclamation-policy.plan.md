# Task 32 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-32-slug-reclamation-policy.md](./task-32-slug-reclamation-policy.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §18 row #4 + Appendix A: a slug should rotate back to the available pool when its owner has been silent for 30+ days AND has no active subscription. Today nothing reclaims; abandoned slugs sit forever, blocking new artists from claiming popular handles. Task-32 ships:

1. A daily cron that sweeps "inactive" Profiles, emails the owner at Day-23, and soft-releases the slug at Day-30.
2. A reversible "soft-released" window (24h) so an honest mistake is recoverable.
3. A "Keep my slug" one-click action linked from the warning email.
4. Defense-in-depth: an active-or-past-due Stripe subscription beats inactivity (a paying customer is never reclaimed).

Existing primitives task-32 builds on: the cron pattern from task-23/30 (`CRON_SECRET` Bearer auth), the email transport from task-30 (`lib/email/send.ts`), the i18n catalogs from task-29, and the trial-pause cron's user-iteration shape.

## Audit — what's already shipped

| Surface | Status | Where |
|---|---|---|
| Profile.status enum (`draft` / `published` / `unpublished` / `paused`) | ✅ done | [Profiles.ts:118-129](../../payload/collections/Profiles.ts#L118) |
| `slug_reservations` table with `reserved` / `soft_hold` types and TTL | ✅ done in task-07 | `supabase/migrations/20260504000001_*` |
| `slug_redirects` table for old→new redirects | ✅ done in task-07 | same migration |
| Trial-pause cron + `CRON_SECRET` auth shape | ✅ done in task-23 | [pause-expired-trials.ts](../../lib/billing/pause-expired-trials.ts) |
| Email transport | ✅ done in task-30 | [lib/email/send.ts](../../lib/email/send.ts) |
| Profile-level analytics rollups | ✅ done in task-24 | `analytics_events`, `analytics_daily_rollups` |

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | New status value | Add `'soft-released'` to `Profile.status`. Two new fields: `slugReclaimWarningAt` (Day-23 timestamp) and `slugSoftReleasedAt` (Day-30 timestamp). Both `admin: { readOnly: true }`. | Soft-release is a reversible state; the timestamps drive the cron logic and the 24h revert window. |
| 2 | Inactivity primitives | Pure helper `decideReclaimAction({ now, profile, lastSignInAt, recentEventCount, hasActiveSub, warningSentAt })` → `'skip' \| 'warn' \| 'release' \| 'finalize'`. Activity is the **most recent** of: profile.updatedAt, user.lastSignInAt, recent analytics events for the profile in the last 30 days. | One pure function = one matrix of test cases. Mirrors `next-health.ts` pattern from task-30. |
| 3 | Sweep orchestrator | `sweepInactiveSlugs({ deps })` — concurrency 10, same shape as task-30's `sweepPressKitHealth`. Each profile passes through `decideReclaimAction`; the orchestrator drives the email + status mutation + audit log. | Reuses the proven shape; testable with fake deps. |
| 4 | Active-subscription gate | The cron's candidate query filters `users.stripeSubscriptionStatus NOT IN ('active', 'past_due')` AND status NOT IN ('paused') (paused already has its own 90-day grace from task-23). | AC #2: "active paying user is never reclaimed" + spec note about paused-grace precedence. |
| 5 | Day-23 warning email | Renders via `lib/email/templates/slug-reclaim.ts` in the owner's `Profile.defaultLocale`. Body links to `/api/slug/keep?token=<sig>` (signed query — no auth required, immune to expired Supabase sessions). The token is HMAC over `(profileId, warningAt)` with `KEEP_SLUG_TOKEN_SECRET`. | One-click without re-auth. Token expires at Day-30 (7-day window) and is invalidated by a successful keep-slug call. |
| 6 | Soft-released → finalize | At Day-31 (24h after soft-release), the same cron run finalizes: insert a `slug_reservations` row with `type='soft_hold'` expiring in 90 days (so the slug can't be re-claimed by the same user during recovery), and set `Profile.status = 'unpublished'` + null out `Profile.slug`. Wait — slug is required+unique on Profiles; we instead rotate to `<slug>-r<n>` (a recoverable suffix) so DB constraint stays. | Database constraint dictates: can't null `slug` since it's `required: true`. The rotation suffix is an industry-standard "tombstone" approach. |
| 7 | Audit log | Reuse `analytics_events` with `event_type = 'slug_reclaim_warned' \| 'slug_reclaim_soft_released' \| 'slug_reclaim_finalized' \| 'slug_keep_clicked'`. Write via the same `/api/track` ingestion (server-side, service-role). | Avoids a new collection; fits the existing logging surface. |
| 8 | "Keep my slug" route | `GET /api/slug/keep?token=<sig>` — verifies HMAC, clears `slugReclaimWarningAt`, returns a small HTML "Slug saved!" page in the user's locale. No login required. | One-click is the spec; signed URL is the security boundary. |
| 9 | Cron schedule | `POST /api/cron/slug-reclaim`, `CRON_SECRET` Bearer (same shape as billing + press-kit). Vercel-side schedule lives in the project config (out of repo). Recommended cadence: 04:00 UTC daily, 1h after the press-kit cron. | Consistent with the two existing crons. |
| 10 | Out of scope | Verified-artist exemption (v2 per PRD), admin-panel undo UI (Payload Admin alone is sufficient — flip status back to `'unpublished'` and rotate the slug forward; documented in the runbook). | Spec scope-out. |

## File inventory

### New
- `lib/slug-reclaim/decide-action.ts` — pure inactivity decision (TDD).
- `lib/slug-reclaim/decide-action.test.ts` — every (warned? × active? × paused? × within-30d?) matrix.
- `lib/slug-reclaim/keep-slug-token.ts` — HMAC sign + verify + expiration check.
- `lib/slug-reclaim/keep-slug-token.test.ts` — happy path + tampered + expired + missing-secret.
- `lib/slug-reclaim/sweep.ts` — orchestrator with DI on candidates / status mutation / email / audit log.
- `lib/slug-reclaim/sweep.test.ts` — end-to-end with fake deps; covers warn-only, soft-release, finalize, kept-by-action.
- `lib/email/templates/slug-reclaim.ts` — warning + released templates rendered via `getTranslations({ locale })`.
- `app/api/cron/slug-reclaim/route.ts` — Bearer-authed POST, wires live deps.
- `app/api/slug/keep/route.ts` — token-authed GET (no Supabase session needed).
- `tests/e2e/slug-reclaim-auth.spec.ts` — `@smoke` 401 cron-auth + 401 keep-slug-token.

### Modified
- `payload/collections/Profiles.ts` — adds `'soft-released'` to status options + `slugReclaimWarningAt` + `slugSoftReleasedAt`.
- `payload-types.ts` — regenerated.
- `messages/{pt,en,es}.json` — `email.slugReclaimWarning.{subject,body}` + `email.slugReclaimReleased.{subject,body}` + `slug.keepSuccess.{title,body}`.
- `.env.example` — `KEEP_SLUG_TOKEN_SECRET=`.
- `docs/runbooks/dev-editor.md` — new "Slug reclamation cron" recipe + admin-undo SQL note.

### Untouched (verified)
- The middleware (cron route already excluded by `/api/*` matcher).
- The trial-pause cron (independent surface; runs at 03:00 UTC).
- The analytics ingestion (we just write event_type rows; no schema change).

## Implementation sequence

1. **Plan doc** (this).
2. **`decideReclaimAction` (TDD).** State-machine.
3. **`keepSlugToken` HMAC sign/verify (TDD).**
4. **Schema additions (Profiles status + 2 timestamps); regen types.**
5. **i18n keys (4 strings × 3 locales) + `i18n:check`.**
6. **Email template.**
7. **`sweepInactiveSlugs` orchestrator (TDD).**
8. **Cron route + keep-slug route.**
9. **`tests/e2e/slug-reclaim-auth.spec.ts`.**
10. **Runbook recipe.**
11. **Verification (typecheck + tests + i18n:check + build + e2e + bundle:check).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Reclamation cron runs daily and processes the queue idempotently | Route wired with same auth shape as billing/press-kit; Vercel cron config out-of-repo. Idempotency: warned profiles are not re-warned within the 7-day window (`slugReclaimWarningAt` gate). |
| An active paying user is never reclaimed | Candidate query filter excludes `stripeSubscriptionStatus IN ('active', 'past_due')`; sweep tests cover the gate. |
| Warning email links directly to a "Keep my slug" one-click action | `/api/slug/keep?token=<sig>` — HMAC-signed query param; route tests cover sign/verify; runbook records the manual click flow. |
| Released slugs become available within 1 hour of the cron run | Cron flips status + writes timestamps within seconds; the slug-availability checker (`checkSlugAvailability`) reads `Profiles.slug` directly, so once the rotated suffix is in place the original slug is available immediately. The "1 hour" SLA is well-padded. |

## Test plan

- **Unit:** `decideReclaimAction` matrix (within-30d/warned/active-sub/paused/etc.); `keepSlugToken` (sign+verify, tampered, expired, missing secret); `sweepInactiveSlugs` end-to-end with fake deps.
- **E2E (`@smoke`):** `/api/cron/slug-reclaim` returns 401 without bearer; `/api/slug/keep` without token returns 401 (signed URL is the only auth).

## Risks

- **R1 — False reclaim on a real-but-quiet artist.** A working DJ might not log in for 6 weeks but still get bookings via their public page. *Mitigation:* the inactivity check requires NO public-page traffic in the 30-day window. A trickle of analytics events resets the clock — no traffic = the slug isn't generating value anyway.
- **R2 — Token leak in email logs.** If the warning email is logged with the full URL, the HMAC token leaks. *Mitigation:* `lib/email/send.ts` already redacts to `[contact-form] RESEND_API_KEY unset — message NOT delivered:` + the structured args; logs include the URL but those logs are server-only. We document the secret in the runbook and rotate via env.
- **R3 — Race: user logs in after Day-30 sweep but before the email arrives.** The cron has already soft-released. *Mitigation:* the keep-slug action is idempotent and reverses both `slugReclaimWarningAt` and `slugSoftReleasedAt` (returns the slug to its prior `published` state if the row's slug-rotation hasn't been finalized yet). Day-31 finalize is a separate sweep tick, so there's a one-day buffer.
- **R4 — 24h reverse window collides with cron cadence.** If the cron runs at 03:00 UTC daily, a profile soft-released at 03:00 today is finalized at 03:00 tomorrow — exactly 24h. *Mitigation:* finalize check is `now - slugSoftReleasedAt > 24h`. Same-tick double-process is impossible because soft-release sets the timestamp; finalize requires it to exist + be > 24h old.

## Done when

1. `bun run test` passes the new specs (decide-action + keep-slug-token + sweep). Existing tests stay green.
2. `bun run i18n:check` passes with 6 new keys × 3 locales.
3. `bun run typecheck` + `bun run build` green.
4. `tests/e2e/slug-reclaim-auth.spec.ts` green: 401 unauth cron + 401 token-less keep-slug.
5. The runbook records the curl recipe + admin-undo SQL.
6. Plan doc (this) committed alongside implementation.

## Out of scope (post-task-32)

- Verified-artist exemption (v2 per PRD).
- Admin-panel "Undo recent reclaim" UI (Payload Admin's row editor is sufficient for v1).
- A separate `slug_reclaim_audit` collection (analytics_events tags carry the audit trail).
- Re-publishing a recovered slug after Day-30 finalize: the slug is freed back to the pool but the original Profile.slug is rotated; the artist must re-claim via onboarding's existing flow.
