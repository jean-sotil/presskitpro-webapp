# Task 07 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-07-slug-rules-and-reservations.md](./task-07-slug-rules-and-reservations.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Slugs are user-facing identity (`presskit.pro/{slug}`). They must be unique, safe, syntactically clean, and resilient against squatting. Task-07 lands the validator + the persistence model that task-06 (wizard) and task-19 (public profile) consume.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Profanity matching | **Hand-rolled lists** in `data/profanity-{en,pt}.txt` + `containsProfanity()` | Repo-owned lists tune for DJ name conventions; avoids the `bad-words` library's stale matches and false positives. |
| 2 | Reserved words | Seeded rows in `slug_reservations` with `expires_at IS NULL`, `type='reserved'` | Matches task spec; one table, one query for "available?". |
| 3 | Schema layout | Single `public.slug_reservations(slug, type, held_by_user_id, expires_at)` table | Discriminator `type` unifies reserved + soft-hold. `slug` is PK. |
| 4 | `slug_redirects` table | Land schema + `recordSlugChange()` helper; public 301 wiring lives in task-19 | Cheap to land now, avoids revisit cost. |
| 5 | Cron sweep | **`pg_cron`** every 5 minutes deletes expired soft-holds | Lives with the data; no Vercel Cron dependency. |
| 6 | `/api/slug/check` order | format → reserved → profanity → Payload `profiles.slug` lookup → `slug_reservations` lookup | Cheap pure checks first; bail at the first miss. |
| 7 | Rate limit | **Defer to Phase C** | Same posture as auth's `/api/auth/*`. Documented as follow-up. |
| 8 | Cross-schema check | Payload Local API for `payload.profiles`; Supabase admin client for `public.slug_reservations` | Each schema queried with its native tool. |

## Cross-references

- PRD §5 (reserved-slug list, URL structure).
- PRD Appendix A (slug grammar, 301 redirect 90-day window).
- PRD §18 row #4 (squatting policy stub — full reclamation in task-32).
- ADR-0001 (schema split — `public` for ops state, `payload` for content).
- task-02's spike migration (`supabase/migrations/20260429000001_*.sql`) — reference for migration style + RLS posture.

## File inventory (deliverables)

### Migration
- `supabase/migrations/<timestamp>_slug_reservations_and_redirects.sql`:
  - `public.slug_reservations(slug TEXT PK, type TEXT NOT NULL, held_by_user_id UUID NULL, expires_at TIMESTAMPTZ NULL, created_at TIMESTAMPTZ DEFAULT now())` — `type` checked to `('reserved','soft_hold')`.
  - `public.slug_redirects(old_slug TEXT PK, new_slug TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`.
  - INSERT seed rows for the §5 reserved list (29 words).
  - `pg_cron` job: every 5 min, delete `slug_reservations` rows where `type='soft_hold' AND expires_at < now()` AND delete `slug_redirects` rows where `expires_at < now()`.
  - RLS: spike-only posture matches task-02 (public read on neither — only service-role/server reads). Hardened in task-27.

### Validator (pure, TDD)
- `lib/slug/validator.ts`:
  - `validateSlugFormat(input: string): ValidationResult` — regex + length + no-leading/trailing-hyphen + no-consecutive-hyphens.
  - `containsProfanity(slug: string, locale: 'en' | 'pt' | 'all' = 'all'): boolean` — substring match against bundled lists.
  - `loadProfanityLists()` — reads `data/profanity-{en,pt}.txt` at module load; lazy-cached.
- `lib/slug/validator.test.ts` — table-driven unit tests for both functions; ≥ 20 fixtures (ok / too-short / too-long / leading-hyphen / consecutive-hyphens / capital / unicode / profanity hit / clean DJ name like "vitalic-dj" / etc.).
- `data/profanity-en.txt` — ~30-line baseline (standard EN obscenities + common slurs).
- `data/profanity-pt.txt` — ~30-line baseline (PT-BR equivalents).

### Composite check + helpers
- `lib/slug/check.ts`:
  - `checkSlugAvailability({ slug, requestingUserId? }): Promise<CheckResult>` — runs the full chain (format → reserved → profanity → profiles → reservations) and returns `{ available, reason? }` with the typed reason union from the task spec.
  - `reserveSlug({ slug, userId, ttlMinutes? = 15 }): Promise<ReserveResult>` — UPSERT a `soft_hold` row.
  - `releaseSlug({ slug, userId }): Promise<void>` — DELETE only if owner matches.
  - `recordSlugChange({ oldSlug, newSlug, userId }): Promise<void>` — INSERT into `slug_redirects` with 90-day TTL; updates Payload profile slug atomically.

### API routes
- `app/api/slug/check/route.ts` — `GET ?slug=…` → 200 with `{ available, reason? }`. Public-readable; rate-limited later.
- `app/api/slug/reserve/route.ts` — `POST { slug }` → requires authenticated user (uses `supabaseServer().auth.getUser()`); UPSERTs hold; returns `{ ok: true, expiresAt }`.
- `app/api/slug/release/route.ts` — `POST { slug }` → auth-gated; releases the caller's hold.

### Tests
- `lib/slug/validator.test.ts` — Vitest, pure.
- `lib/slug/check.test.ts` — Vitest with mocked Supabase + Payload (the composite logic).
- `tests/e2e/slug-check.spec.ts` — Playwright: hits live `/api/slug/check?slug=admin` → expects `available: false, reason: 'reserved'`. Uses a known-seeded reserved word so no test data setup needed.

### Docs
- `docs/runbooks/migrations.md` — append note about the new migration + the pg_cron sweep.

## Implementation sequence

1. **Migration first** (so the dev DB has the table when API code is written). Author SQL → run `supabase db push` against the linked dev project → verify with `psql`.
2. **Validator + profanity lists (TDD).** Tests first → red → impl → green.
3. **Composite check (TDD with mocks).** `lib/slug/check.ts` tests cover: reserved hit, profanity hit, profile collision, soft-hold by other user, soft-hold by *current* user (allowed), available case.
4. **API routes.** `check` first (read-only); then `reserve` + `release` (auth-gated).
5. **e2e spec.** One Playwright test against the running production build.
6. **Verification matrix.** typecheck/lint/test/contrast/e2e all green.

## Acceptance evidence (Verification Matrix)

| AC (from task) | How verified |
|---|---|
| Reserved §5 words return `available: false, reason: 'reserved'` | Unit + e2e against `?slug=admin`. |
| PT/EN profanity blocked, FP rate < 1% on 100 DJ names | Unit suite seeds ~10 known-bad and ~30 real DJ names; assertion on the FP rate. |
| Soft-hold expires automatically | Migration sets `expires_at = now() + 15m` on reserve; pg_cron sweeps. Verified by inserting a row with `expires_at = now() - 1m` and waiting one cron tick (or running the cron function manually via `SELECT cron.run_job(...)`). |
| Slug change → `slug_redirects` row with `expires_at = now() + 90d` | `recordSlugChange()` test asserts row shape. |

## Test plan (TDD)

- **Pure unit:** validator (format + profanity).
- **Integration unit:** composite `checkSlugAvailability` with mocked Supabase admin + mocked Payload `find`. Cover all `reason` branches.
- **E2E:** one route check against live dev DB (read-only, against seeded reserved words). No mutating tests in CI.

## Out of scope (explicit)

- Wiring `/api/slug/reserve` into the wizard UI — task-06.
- Wiring 301 redirect into `/{slug}` public route — task-19.
- 30-day inactivity reclamation — task-32.
- Verified-artist flow — v2.
- Rate-limiting `/api/slug/check` — Phase C (same posture as auth).

## Risks

- **R1 — pg_cron not enabled on hosted project.** Most Supabase free-tier projects enable `pg_cron` by default; if not, the migration falls back to enabling the extension in the same SQL. *Mitigation:* migration includes `CREATE EXTENSION IF NOT EXISTS pg_cron`.
- **R2 — Profanity list false positives.** Names like `Massive`, `Skrillex` could match poorly-tuned substrings. *Mitigation:* word-boundary matching, not substring; FP gate test asserts < 1% on 100 real names. Curated list, not auto-generated.
- **R3 — Cross-schema query latency.** Each `/api/slug/check` does up to two DB roundtrips (Payload + Supabase). *Mitigation:* short-circuit on early failures (format / reserved / profanity); both DB queries are PK lookups (sub-ms). p95 < 200ms is achievable.
- **R4 — Service-role key exposure.** `/api/slug/reserve` needs admin DB access. *Mitigation:* the route handler runs on the server only, uses `supabaseAdmin()` from `lib/supabase/admin.ts` (already gated by `'server-only'`).

## Done when

1. Every AC above green; e2e + units all pass.
2. Migration applied to the linked dev DB; `psql` confirms 29 reserved-word rows + the pg_cron job exists.
3. `docs/runbooks/migrations.md` notes the new migration.
4. Plan file (this doc) committed alongside implementation.
