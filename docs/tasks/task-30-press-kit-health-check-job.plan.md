# Task 30 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-30-press-kit-health-check-job.md](./task-30-press-kit-health-check-job.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §6.5 requires that a published profile's external press-kit URL stay reachable. Today task-15 derives the provider on save but never re-checks. A dead Drive folder silently rots the public CTA. Task-30 adds a daily HEAD-sweep that:

1. Updates `pressKitLastCheckedAt` on every check.
2. Increments a consecutive-failures counter; flips status to `warning` at 2 fails, `broken` at 3.
3. Sends a translated email at each transition (warning + broken).
4. Hides the public CTA when status is `broken` (next ISR/dynamic render).

Every primitive task-30 needs already exists (cron-route pattern, Resend wiring, i18n catalogs, profile schema). PR-1 is purely additive.

## Audit — what's already shipped

| Surface | Status | Where |
|---|---|---|
| `Profiles.pressKitUrl`, `pressKitProvider`, `pressKitLastCheckedAt`, `pressKitHealthStatus` (with `unknown`/`healthy`/`warning`/`broken` options) | ✅ done in task-08 | [Profiles.ts:160-210](../../payload/collections/Profiles.ts#L160) |
| Provider derivation hook | ✅ done in task-15 | [derive-press-kit-provider.ts](../../lib/payload/hooks/derive-press-kit-provider.ts) |
| Cron route pattern + `CRON_SECRET` Bearer auth | ✅ done in task-23 | [app/api/cron/billing/route.ts](../../app/api/cron/billing/route.ts) |
| Resend transactional email | ✅ done in task-14 | inline `sendEmail()` in [contact-submit/route.ts](../../app/api/profiles/%5Bid%5D/contact-submit/route.ts) |
| `getTranslations({ locale })` for email templates | ✅ done in task-29 | next-intl/server |
| Public profile render of the press-kit CTA | ✅ done in task-15 | [PressKitLinkRender.tsx](../../components/profile/sections/PressKitLinkRender.tsx) |
| Profile.defaultLocale (proxy for "owner's preferred locale") | ✅ done in task-08 | (no per-User locale field exists; the profile's defaultLocale is the right axis) |

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | New schema field | Add `pressKitConsecutiveFails: number, default 0, admin-readonly` to `Profiles`. The transition rules read this; it never appears in the editor UI. | Explicit counter beats deriving from history. Reseting to 0 on success is a one-line update. |
| 2 | Health-check primitive | `checkPressKitUrl(url, deps)` → `{ ok: boolean, statusCode?: number, kind: 'http-2xx' \| 'http-3xx' \| 'http-error' \| 'timeout' \| 'network-error' }`. Pure DI on `fetch`, `now`. 8s timeout via `AbortController`. Fallback to ranged GET (`Range: bytes=0-0`) when HEAD returns ≥ 405. | Spec implementation note. Keeps the function unit-testable with a fake fetch. |
| 3 | Provider rate-limits | Concurrency 10 across the entire sweep. No per-host throttle in v1 — Drive's documented HEAD limit is generous and we won't blow it on hundreds of profiles. | YAGNI. Add a per-host queue when we actually see 429s in production. |
| 4 | Status transition rules | Pure function `nextHealth({ priorStatus, priorFails, checkOk })` → `{ status, fails, transitioned: boolean }`. Encodes the spec's 2/3 thresholds + reset-on-success. Returns `transitioned: true` when status flipped, so the caller knows to send the right email. | One source of truth for the state machine; trivially testable. |
| 5 | Email locale | Read `Profile.defaultLocale`, map via `fromPayloadLocale()` to a next-intl short code, then `getTranslations({ locale: short })`. No per-User locale field today — the profile's default is the proxy. | Spec AC: "Email content is translated per the DJ's preferred locale (task-29)." |
| 6 | Email send transport | Reuse the inline `sendEmail()` from contact-submit by extracting it into `lib/email/send.ts`. Same Resend wiring; same `RESEND_API_KEY`-unset → console-warn fallback. | DRY without overengineering — one transport, two callers. |
| 7 | Cron schedule | New route `app/api/cron/press-kit-health/route.ts`, same Bearer-auth + POST shape as `/api/cron/billing`. Vercel cron is configured at the dashboard level (no `vercel.json` in repo today; this PR doesn't introduce one — the existing analytics + billing crons follow the same convention). Runbook documents the curl + the Vercel cron entry. | Consistent with the two existing crons. |
| 8 | Public CTA hide | `PressKitLinkRender` returns `null` when `pressKitHealthStatus === 'broken'`. Provider badge + CTA both disappear; the section just doesn't render. | Spec scope. The artist sees their own broken state in the dashboard banner (deferred — see scope-out). |
| 9 | ISR / freshness | The public profile is `force-dynamic` (task-29 PR-B). When the cron updates a profile and the status changes, the next request renders the new state automatically. No `revalidatePath` needed. | Free correctness from PR-B's invariant. |
| 10 | Out of scope (PR-1) | Dashboard warning banner (no editor chrome translations yet — task-29 PR-C territory); per-User preferred locale; Drive-specific OAuth probes; long-link follow chains; alert-suppression on transient 5xx storms. | Each is a separate, low-risk follow-up. |

## File inventory

### New
- `lib/health-check/check-press-kit-url.ts` — pure HEAD/GET fetcher with timeout + fallback.
- `lib/health-check/check-press-kit-url.test.ts` — fake-fetch coverage of every branch.
- `lib/health-check/next-health.ts` — pure transition function (counter + status).
- `lib/health-check/next-health.test.ts` — TDD: every fail/success matrix.
- `lib/health-check/sweep.ts` — pure orchestrator (DI on `findProfiles`, `checkUrl`, `updateProfile`, `sendEmail`, `now`); concurrency-10 batches.
- `lib/health-check/sweep.test.ts` — fake-deps tests covering 2-fail and 3-fail transitions + email triggers.
- `lib/email/send.ts` — extracted Resend transport.
- `lib/email/send.test.ts` — covers the unset-key fallback + happy path.
- `lib/email/templates/press-kit.ts` — pure template builder; reads `getTranslations` for the locale.
- `app/api/cron/press-kit-health/route.ts` — Bearer-authed POST; wires `sweepPressKitHealth` to live deps.
- `tests/e2e/cron-auth.spec.ts` — `@smoke` confirming the route 401s without `Authorization` and 200s with the seed secret (lifted from existing billing-cron coverage if any).

### Modified
- `payload/collections/Profiles.ts` — add `pressKitConsecutiveFails` (number, default 0, readOnly admin).
- `payload-types.ts` — regenerate via `bun run generate:types`.
- `app/api/profiles/[id]/contact-submit/route.ts` — swap inline `sendEmail` for the extracted helper.
- `components/profile/sections/PressKitLinkRender.tsx` — add the `broken` short-circuit.
- `messages/{pt,en,es}.json` — add `email.pressKitWarning.{subject,body}` + `email.pressKitBroken.{subject,body}`.
- `docs/runbooks/dev-editor.md` — append a "Press kit health-check cron" recipe (curl + manual fixture + Vercel schedule note).

### Untouched (verified)
- Existing analytics + billing crons (the auth pattern is reused as-is).
- The provider-derivation hook from task-15.
- The middleware (no path-level changes for cron auth — the route is already exempt by the matcher).

## Implementation sequence

1. **Plan doc** (this).
2. **`next-health.ts` (TDD).** State machine.
3. **`check-press-kit-url.ts` (TDD).** Fetcher with timeout + fallback.
4. **Add `pressKitConsecutiveFails` to schema; regenerate types.**
5. **`lib/email/send.ts` extraction (TDD on the unset-key path).**
6. **Email templates + i18n strings (4 locales × 2 templates).**
7. **`sweep.ts` (TDD).** End-to-end orchestrator with fake deps.
8. **Cron route handler.**
9. **PressKitLinkRender broken-state gate.**
10. **`tests/e2e/cron-auth.spec.ts`.**
11. **Runbook recipe.**
12. **Verification (typecheck + tests + i18n:check + build + e2e + bundle:check).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Cron runs reliably at the scheduled time on production | The route is wired; Vercel-side schedule lives in the project config the user manages. The runbook documents the schedule and the curl command for manual triggers. |
| Test fixtures with known-broken URLs flip to `broken` after exactly 3 failures | `sweep.test.ts` — fake deps; iterate three times with a failing fetcher; assert final `pressKitHealthStatus === 'broken'` and exactly two emails were sent (warning at iter 2, broken at iter 3). |
| Email content translated per the DJ's preferred locale | `next-health.ts` + `sweep.ts` thread the profile's `defaultLocale`; templates rendered via `getTranslations({ locale })`; `i18n:check` enforces key parity across pt/en/es. |
| CTA hide takes effect within the next ISR revalidation cycle | `/[slug]` is `force-dynamic` (task-29 PR-B), so the next request renders the updated `pressKitHealthStatus` immediately. PressKitLinkRender's broken-state branch is unit-tested. |

## Test plan

- **Unit:** `nextHealth` matrix; `checkPressKitUrl` for HEAD-2xx, HEAD-405 → ranged GET, network error, timeout, redirect chain ending in 404, redirect chain ending in 200; `sweep` end-to-end with fake deps + transition assertions.
- **E2E (`@smoke`):** `cron-auth.spec.ts` — POST `/api/cron/press-kit-health` returns 401 without auth and 200 with the seeded `CRON_SECRET`. Body shape: `{ checked, healthy, transitionedToWarning, transitionedToBroken, durationMs }`.

## Risks

- **R1 — Drive throttling on a large cohort.** Concurrency 10 with hundreds of profiles per cron is fine for v1. *Mitigation:* the runbook records the actual sweep duration; if 4xx spikes appear, the next iteration adds a per-host queue.
- **R2 — Transient 5xx false positives.** A provider hiccup at 03:00 UTC could flip every Drive-hosted profile to `warning`. *Mitigation:* the counter resets on the next successful check, so a one-day blip self-heals before transitioning to `broken`.
- **R3 — Email storm on a backfill run.** Running the cron against a freshly-imported dataset could fire hundreds of warning emails at once. *Mitigation:* the cron only emails on STATE TRANSITIONS, not on every check — and the counter starts at 0, so the first run can only emit warnings (not brokens) and only for URLs that ALREADY fail twice in a row, which is a same-day double-check that won't happen on a fresh run.
- **R4 — Locale code mismatch.** `Profile.defaultLocale` stores `pt-BR`/`en`/`es`; next-intl uses `pt`/`en`/`es`. *Mitigation:* `fromPayloadLocale()` already exists from task-29 PR-B; tests cover the round-trip.

## Done when

1. `bun run test` includes new specs for `next-health`, `check-press-kit-url`, `sweep`, and the email send fallback — all green.
2. `bun run i18n:check` passes with 4 new keys × 3 locales.
3. `bun run typecheck` + `bun run build` succeed.
4. `tests/e2e/cron-auth.spec.ts` green (401 unauth, 200 with secret).
5. A manual curl against the cron route in dev returns the summary JSON; the runbook records the recipe.
6. Plan doc (this) committed alongside implementation.

## Out of scope (post-task-30)

- Dashboard warning banner for the artist (chrome translation is task-29 PR-C; the banner block can land in PR-C-1 as a 5-line addition once the namespace is wired).
- Per-User `preferredLocale` field on `Users` (the profile's default is sufficient until users start owning multi-locale profiles).
- Drive-specific deep checks (folder vs file, viewer permission probe).
- Sentry-based alerting on transient 5xx storms (task-28).
- Backfill helper to seed `pressKitConsecutiveFails: 0` on existing rows (Payload's default-on-add handles new docs; existing rows get 0 from the schema default the first time the cron writes to them).
