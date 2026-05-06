# Task 19 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-19-public-profile-page.md](./task-19-public-profile-page.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

The public profile is the product's **only outward-facing surface** — every other task feeds it. Three patterns get exercised that downstream tasks (SEO in task-20, performance budget in task-26, public preview in task-29) reuse:

1. **Slug-based public bundle.** A new `loadPublicBundle({ slug })` mirrors the editor's `loadBundle({ profileId, user })` but flips two switches: lookup by slug, and `overrideAccess: true` on every Local API call (since the visitor isn't logged in). Status gate: only `'published'` profiles are returned; everything else is `null` → `notFound()`.
2. **`generateMetadata` per profile.** Server-side resolves the slug, returns `<title>`, `description`, OG image. Falls back to display-name + tagline when SEO fields aren't filled. Same code path the indexable scrape sees → no client-side recompute.
3. **`<style>` injection in `<head>`.** Already wired by task-18's `ProfileRenderer` (per-profile data-attr scope). Public route hoists the same element into the document head via React's natural rendering — no extra plumbing.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Routing | `app/[slug]/page.tsx` at the root. Next.js routes resolve in order — concrete dirs (`/dashboard`, `/login`, `/api`, `/onboarding`) win over the dynamic catch-all. Reserved slug list (task-07) prevents collisions even for unowned slugs. | Cleanest URL shape; matches the product brand `presskit.pro/{slug}`. |
| 2 | Bundle loader | New pure helper `loadPublicBundle({ slug, deps })` plus a live wiring `livePublicBundleDeps()`. Reuses every existing section's render fixture but adds: `findPublishedProfileBySlug` (returns null when `status !== 'published'`). | Decouples the public read from the auth-gated editor read. Tests cover the gate by injecting a profile with `status: 'draft'`. |
| 3 | 404 vs paused | Hard 404 for missing or draft/unpublished. **Trial-expired ("paused") gets its own page (per PRD §16) — but trial billing lands in task-31, so this pass treats paused exactly like 404 with a TODO marker.** | Shipping the paused page now would force a contract on billing fields that don't exist yet. The 404 is correct behavior in v1 (no billing). |
| 4 | Metadata | `generateMetadata({ params })` resolves the slug with the same loader. `title = content.metaTitle ?? "${displayName} — ${tagline}" ?? slug`. `description = content.metaDescription ?? tagline ?? ''`. `openGraph.images = [content.ogImage ?? profile.portrait]`. Locale fallback already covered by Payload's `localization.fallback`. | Spec §9. Prevents duplicate `<title>` text in CMS-empty profiles. |
| 5 | Anchor nav | Sticky `<nav>` at the top of `<main>` with anchors keyed off the same `sectionOrder`. Only renders sections that actually have content (the same null-checks each Render component already does). Smooth scroll via CSS `scroll-behavior: smooth` with a `prefers-reduced-motion` exemption. | Spec AC. CSS-only smooth scroll is good enough; no JS for this. |
| 6 | Hero image | Migrate `HeroRender` to `next/image` with `priority` on the portrait, explicit `width`/`height` (computed from the natural dimensions stored on `Media`), `sizes="100vw"`. Logos and gallery items stay `<img>` for now (logos are optional and cheap; gallery is task-26's perf optimization). | Spec AC (LCP gate). |
| 7 | Headers | The route handler appends `Vary: Accept-Language` so future locale negotiation doesn't get the wrong cached entry. ISR cache key includes the slug; revalidation already wired by task-08's `handleProfileRevalidate` afterChange hook. | Spec note (§18 risk #12). |
| 8 | Out of scope | Locale toggle UI (task-29). `/explore` directory (v2). Cron pre-warm (task-26 / task-30 follow-up). Lighthouse gate enforcement (task-26). | Spec scope-out. |

## Cross-references

- PRD §6.4 (page structure), §8 (RSC + Local API), §9 (SEO), §11 (a11y), §13 (perf), §16 (paused state), §18 row #12 (Vary header).
- task-08 (Profiles + Themes schema, revalidation hook), task-13–17 (section render components), task-18 (ProfileRenderer + theme injection), task-20 (SEO foundation builds on `generateMetadata` here), task-26 (perf budget enforcement), task-31 (trial-paused billing flow).

## File inventory

### Pure helpers (TDD)
- `lib/editor/bundle.ts` — extend `BundleDeps` with `findPublishedProfileBySlug`. Add `loadPublicBundle({ slug, deps })` returning `EditorBundle | null`.
- `lib/editor/bundle.test.ts` — cover the public-bundle loader.

### Live wiring
- `lib/editor/bundle-public-live.ts` — `livePublicBundleDeps()` mirroring the editor wiring but with `overrideAccess: true` on every Payload call. Lookup by slug; returns `null` when `status !== 'published'`.

### Public route
- `app/[slug]/page.tsx` — server component, `generateMetadata`, renders `<ProfileRenderer mode="public">`. Sets `Vary: Accept-Language` via `headers()` mutation in metadata or a route-level `headers()` callback.
- `app/[slug]/AnchorNav.tsx` (server component) — sticky in-page nav based on the resolved sectionOrder.
- `app/[slug]/not-found.tsx` — branded 404 page.

### Renderer polish
- `components/profile/sections/HeroRender.tsx` — swap the portrait `<img>` for `next/image priority` + explicit dims, keep alt text fallback.

### E2E + runbook
- `tests/e2e/public-profile.spec.ts` — `@full` happy path: visit `/<slug>` published → assert h1, OG meta, anchor nav. Visit a draft slug → 404.
- `docs/runbooks/dev-editor.md` — append the public-route smoke recipe.

## Implementation sequence

1. **Plan doc** (this).
2. **Bundle helper extension (TDD)** — `findPublishedProfileBySlug` dep + `loadPublicBundle`.
3. **Live public bundle wiring** — `livePublicBundleDeps`.
4. **Public route + `generateMetadata` + `notFound()` plumbing.**
5. **Anchor nav.**
6. **HeroRender → `next/image priority`.**
7. **Vary header + custom 404.**
8. **E2E + runbook.**

## Acceptance evidence

| AC | How verified |
|---|---|
| 404 for unpublished / missing slugs | Bundle test asserts `loadPublicBundle({ slug })` returns null for draft + missing. Page test (E2E) asserts `404` HTTP status. |
| Section order driven by `Themes.sectionOrder` | Reuses task-09's `ProfileRenderer` order resolution; tested there. |
| Theme injected as `<style>` block | Already wired by task-18. The public route's `<head>` naturally hoists the React `<style>` element. Asserted by an integration test of `ProfileRenderer` (already in place; this task adds a route smoke). |
| Hero portrait via `next/image priority` | Snapshot/integration test on `HeroRender` asserts the rendered img has `data-nimg` (Next's marker) and `priority` semantics. |
| Single `<h1>` = artist name | Existing `HeroRender` test asserts a single `<h1>`. The public-route smoke re-asserts. |
| Vary header | Route smoke asserts `Vary` includes `Accept-Language`. |
| ISR revalidation < 5s on republish | Already wired by `handleProfileRevalidate` (task-08); the route inherits via Next ISR. Documented; manual test recipe in runbook. |

## Test plan

- **Unit:** `loadPublicBundle` (status gate, missing slug, full bundle composition).
- **Integration:** existing `ProfileRenderer` tests pick up theme + sectionOrder; we add an E2E smoke against the live route.
- **E2E:** `@full` happy path (skip-flag gated).

## Out of scope

- Locale toggle UI — task-29.
- `/explore` directory — v2.
- Daily pre-warm cron — task-26 ladder.
- Lighthouse gate enforcement — task-26.
- Paused/trial-expired page — task-31 (treated as 404 in this pass, with a TODO marker in the route).

## Risks

- **R1 — Catch-all collides with future routes.** Adding `app/[slug]/page.tsx` shadows any non-reserved single-segment top-level path. *Mitigation:* slug validation (task-07) already prohibits the routes we own; new top-level routes need a real-path declaration (e.g. `app/explore/page.tsx`).
- **R2 — Lighthouse 95 not actually measured.** The spec gates on numbers; this pass establishes the structure and leaves measurement to task-26. Documented.
- **R3 — Trial-paused profiles get the wrong UX.** They 404 instead of seeing the paused page. *Mitigation:* TODO marker in the route + plan reference to task-31.

## Done when

1. Public bundle helper TDD green; status gate enforced.
2. `/<slug>` renders for published profiles, 404s for everything else.
3. `generateMetadata` returns title/description/og from the bundle.
4. Hero portrait uses `next/image priority` with explicit dimensions.
5. Anchor nav renders the resolved sectionOrder, only including sections with content.
6. `Vary: Accept-Language` set on the response.
7. Republish via the editor invalidates the public ISR cache (manual smoke).
8. `pnpm test` + `pnpm typecheck` green; e2e `@full` green.
9. Plan file (this doc) committed alongside implementation.
