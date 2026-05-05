# Task 08 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-08-payload-collections.md](./task-08-payload-collections.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Task-08 lands the data model for everything downstream: editor (task-09), public profile (task-19), analytics (task-24). The collections are mostly declarative; the load-bearing complexity is in the auth strategy (so REST returns 403 cross-user), the IG token encryption, and the seed.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Payload REST auth | Custom strategy on `Users` (set `auth: { disableLocalStrategy: true, strategies: [supabaseStrategy] }`). Strategy reads Supabase session cookie → finds the Payload `Users` row by `supabaseUserId` → returns it as `req.user`. | Only way to make the "403 cross-user" AC verifiable without writing custom REST wrappers. |
| 2 | IG token encryption | AES-256-GCM in Node `crypto`. Key from `INSTAGRAM_TOKEN_ENCRYPTION_KEY` env (32-byte base64). Encrypt in Payload `beforeChange`, decrypt in `afterRead` (admin-only). | Vendor-neutral; survives without Supabase Vault. Migrating to Vault later is a key-format change only. |
| 3 | ISR revalidation | `Profiles.afterChange` fires `revalidatePath('/${slug}')` when `status === 'published'`. On slug change, also revalidate the old slug. | Payload runs in-process; `next/cache` works directly. |
| 4 | Slug validation in Payload | `validate` hook on `Profiles.slug` calls `validateSlugFormat()`. `afterChange` calls `recordSlugChange()` when slug differs from previous. | Reuses task-07; no duplication. |
| 5 | Seed | `scripts/seed.ts` uses Payload Local API directly. 5 demo profiles with synthetic `supabaseUserId` UUIDs. Idempotent (delete + recreate the demo set). | Fast, reproducible. Real Supabase auth users not needed for static demo content. |
| 6 | Localization | `payload.config.ts` adds `localization: { locales: ['pt-BR', 'en'], defaultLocale: 'pt-BR', fallback: true }`. `localized: true` on `ProfileContent.{tagline, bio, services, metaTitle, metaDescription, ogImage}`. | Configures both locales now so task-29 doesn't have to retrofit every collection. |
| 7 | Access control depth | Default deny. Allow Admins (`req.user.collection === 'admins'`). Allow `Users` whose `id` matches the doc's `owner` (Profiles) or the parent profile's `owner` (child collections, via a `where` filter). | Standard Payload pattern. Verified by the e2e ladder. |
| 8 | Phasing | One commit. Internal sequence: schemas → access + auth strategy → encryption → ISR hook → seed → tests. | Each step a clean checkpoint, but they ship together — task-09 needs all of it. |

## Cross-references

- PRD §7 (full data model spec).
- PRD §10 (i18n posture — fall-back to defaultLocale).
- PRD §14 (encrypted tokens at rest).
- ADR-0001 (Payload owns content; mirror pattern for Users).
- task-02 spike collections (Users/Profiles/Media — minimum-viable, extended here).
- task-07 slug helpers (`lib/slug/{validator,operations}.ts`).

## File inventory (deliverables)

### Collections
- `payload/collections/Users.ts` — switch to `auth: { disableLocalStrategy: true, strategies: [supabaseStrategy] }`. No new fields.
- `payload/collections/Profiles.ts` — extend with PRD §7 fields (`pressKitUrl`, `pressKitProvider`, `pressKitLastCheckedAt`, `pressKitHealthStatus`, `localesAvailable`, `defaultLocale`). Wire slug validate hook + slug-change → `recordSlugChange` afterChange + ISR revalidate afterChange. Rename `owner` if needed for consistency (currently fine).
- `payload/collections/Media.ts` — extend: `alt` required (validation enforced by access/hook).
- `payload/collections/ProfileContent.ts` — **new**, localized. Relation to Profiles.
- `payload/collections/SocialLinks.ts` — **new**.
- `payload/collections/FeaturedTracks.ts` — **new**.
- `payload/collections/Themes.ts` — **new**, one-to-one with Profiles (`unique` index).
- `payload/collections/InstagramConnections.ts` — **new**, encrypted `accessToken`.

### Auth strategy + lib
- `lib/auth/payload-strategy.ts` — `supabaseStrategy` factory. Reads cookies via Payload's headers arg → decodes Supabase JWT (using `@supabase/ssr` parser if accessible, else manual base64) → looks up Users by `supabaseUserId` → returns the Payload doc.
- `lib/auth/payload-strategy.test.ts` — table-driven tests (no cookies → null, valid cookie → user, mismatched supabaseUserId → null).

### Crypto
- `lib/crypto/symmetric.ts` — `encrypt(plaintext)` / `decrypt(ciphertext)`. AES-256-GCM with a random IV per encryption; output format `iv.tag.ciphertext` (base64 each, dot-separated).
- `lib/crypto/symmetric.test.ts` — round-trip + key-mismatch failure + tampered-ciphertext failure.

### Payload hooks (extracted for testability)
- `lib/payload/hooks/profile-slug-validate.ts` (+ test) — wraps `validateSlugFormat` to return Payload's expected `string | true` validate signature.
- `lib/payload/hooks/profile-slug-changed.ts` (+ test) — afterChange: if `data.slug !== previousDoc.slug`, call `recordSlugChange`. Mocked Supabase client in tests.
- `lib/payload/hooks/profile-revalidate.ts` (+ test) — afterChange: if `published`, `revalidatePath`. Tests mock `revalidatePath`.
- `lib/payload/hooks/encrypt-token.ts` (+ test) — beforeChange + afterRead pair for `accessToken`.

### Access control
- `lib/payload/access/owns-profile.ts` (+ test) — `({ req }) => User-id === doc.owner OR Admin`.
- `lib/payload/access/owns-via-profile.ts` (+ test) — for child collections; resolves to a `where` filter `{ profile: { owner: { equals: req.user.id } } }`.

### Seed
- `scripts/seed.ts` — bun script. Creates 5 demo Users (with synthetic UUIDs) + Profiles + ProfileContent (in PT-BR + EN) + Themes + 2 SocialLinks each + 1 FeaturedTrack each. Run via `bun run seed`.
- `package.json`: `"seed": "bun scripts/seed.ts"`.

### Config
- `payload.config.ts` — register all 8 collections, add `localization` block, ensure user has env-injected localization fallback.
- `.env.example` — add `INSTAGRAM_TOKEN_ENCRYPTION_KEY=` placeholder + setup instructions.

### Type generation
- `payload-types.ts` — regenerated via `bun payload generate:types`. Committed.

### Docs
- `docs/runbooks/migrations.md` — append the Payload migration row.

## Implementation sequence

1. **Schemas first.** Extend Users/Profiles/Media; add five new collections. No hooks yet — just shapes. Run `bun payload generate:types` and confirm types compile.
2. **Localization config.** Add to payload.config.ts. Re-generate types.
3. **`bun payload migrate:create`** captures the diff. Review the SQL. `bun payload migrate` applies to dev DB.
4. **Auth strategy.** TDD: tests for the strategy → impl → wire into Users collection.
5. **Hooks (TDD).** Slug validate, slug-changed, ISR revalidate, encrypt/decrypt.
6. **Access control (TDD).** owns-profile, owns-via-profile.
7. **Encryption + InstagramConnections wiring.**
8. **Seed.** Run `bun run seed` against dev DB. Confirm 5 profiles render.
9. **E2E ladder** for `/api/profiles/[id]`: 401 → 403 → 200.
10. **Verification matrix.**

## Acceptance evidence (Verification Matrix)

| AC (from task) | How verified |
|---|---|
| Type-generation works + consumes cleanly in Next | `bun run typecheck` post-generate. |
| Cross-user REST write returns 403 | E2E spec spins up two users (or simulates two sessions), tries cross-write, asserts 403. |
| Encrypted tokens unreadable in raw DB | Unit test: round-trip the helper; integration check by reading the column directly via Supabase client and asserting it doesn't contain the plaintext. |
| Demo seed produces ≥ 95 Lighthouse on first run | 🚧 deferred to task-19 — needs the public profile route to exist. Documented in plan + task status. |

## Test plan (TDD)

- **Unit:** auth strategy (with mocked cookie parser + Payload client), all four hooks, both access predicates, encryption round-trip.
- **Integration:** none — Payload's collection wiring is declarative; the unit tests on hooks/access cover the testable surface.
- **E2E:** `/api/profiles/[id]` ladder.

## Out of scope (explicit)

- **Public read paths at `/{slug}`** — task-19.
- **Daily health-check cron** — task-30.
- **Lighthouse ≥ 95 on seeded profile** — depends on task-19's actual page existing. Same posture as task-04.
- **Real Supabase auth users in seed** — synthetic UUIDs are sufficient for static demo content.

## Risks

- **R1 — Auth strategy + cookie parsing edge cases.** Supabase rotates session cookies on refresh; the strategy must read the latest, not stale ones. *Mitigation:* use `@supabase/ssr`'s `createServerClient` from inside the strategy with a Payload-headers adapter, then call `auth.getUser()` to get a verified user.
- **R2 — Encryption key rotation.** No rotation story this task. *Mitigation:* document key format as `v1:<base64>` so future versions can prefix with `v2:` and decrypt routes can branch.
- **R3 — Migration order on a fresh DB.** Per ADR-0001, Supabase migrations run BEFORE Payload migrations. The new Payload migration adds tables in `payload.*`; the seed script then writes user-data into them. *Mitigation:* update `docs/runbooks/migrations.md` to note ordering hasn't changed.
- **R4 — Localization fallback noise.** With `fallback: true`, missing-locale lookups return defaultLocale silently. Could mask data bugs. *Mitigation:* document that the public profile route (task-19) must check `localesAvailable` before linking to a locale toggle.
- **R5 — Type generation drift.** `payload-types.ts` is regenerated and committed; if a teammate forgets to regenerate, CI catches it via typecheck failures on the consumer side.

## Done when

1. All 8 collections defined; type-gen clean; `bun run typecheck` green.
2. Auth strategy + access predicates + hooks all unit-tested and green.
3. Encryption round-trip tested.
4. Seed produces 5 demo profiles in dev DB.
5. E2E ladder passes (401 / 403 / 200).
6. Lighthouse ≥ 95 AC explicitly deferred to task-19 in the task status block.
7. Plan file (this doc) committed alongside implementation.
