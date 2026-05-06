# Task 20 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-20-seo-foundation.md](./task-20-seo-foundation.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Task-19 shipped the public profile page with a minimal `generateMetadata`. Task-20 makes that surface **indexable + rich-result-eligible** end-to-end:

1. **Pure metadata builder.** A single `buildProfileMetadata(bundle)` returns the Next `Metadata` object — title fallback, OG, Twitter card, `alternates.canonical`, `alternates.languages` (hreflang). The route's `generateMetadata` is a thin wrapper. Reused by task-29 (locale toggle) without any restructure.
2. **JSON-LD MusicGroup.** A separate `buildProfileJsonLd(bundle)` emits the structured data. Rendered in the page tree as `<script type="application/ld+json">`. `sameAs` array assembles from `socialLinks`, `featuredTrack.url`, `pressKitUrl`. Schema type defaults to `MusicGroup`; future "person artist" toggle is a one-line branch.
3. **Sitemap + robots via Next conventions.** `app/sitemap.ts` returns `MetadataRoute.Sitemap` (paginated query for the > 10k future). `app/robots.ts` returns `MetadataRoute.Robots`. Next handles serving and content-type.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Title fallback | `metaTitle ?? '${displayName} — Press Kit & EPK'`. Spec verbatim. | Spec line. |
| 2 | OG/Twitter image | `content.ogImage ?? profile.portrait`. When neither exists, omit entirely (don't ship a placeholder — Twitter renders fine without). | Spec note ("default OG is the hero portrait"). |
| 3 | Twitter card | `summary_large_image` when an image is available, else `summary`. Title/description match the OG copy. | Standard. |
| 4 | Canonical | `https://${host}/${slug}` — `host` from `process.env.NEXT_PUBLIC_APP_URL` minus the protocol. **No locale prefix, ever.** Keeps the schema flat. | Spec AC. |
| 5 | hreflang | One `<link rel="alternate" hreflang="…">` per locale in `profile.localesAvailable`, plus `x-default = profile.defaultLocale`. URLs are all the same canonical (no locale prefix); locale is negotiated server-side via `Accept-Language` (task-29 wires the actual switch). | Hreflang declares the alternates **exist**, not that they live at distinct URLs. Same-URL alternates are valid per Google's docs. |
| 6 | JSON-LD type | Default `MusicGroup`. The `Profiles` schema doesn't have an "artist type" field yet (task-31 ladder may add it). Until then, `MusicGroup` covers DJs/bands; lone-artist rebranding can flip via a future field with no schema migration. | Avoids schema churn now. |
| 7 | JSON-LD `sameAs` | Concat: every `socialLinks[*].url` (already canonical from task-13), plus `featuredTrack.url`, plus `pressKitUrl`. Dedup, drop falsy. | Maximizes Knowledge Graph linking; all values are sanitized URLs. |
| 8 | Sitemap | `app/sitemap.ts` async function. Paginates `payload.find('profiles', { where: { status: 'published' }, limit: 1000, page })` until exhausted. Returns `[{ url, lastModified, changeFrequency: 'weekly', priority: 0.7 }]`. ISR via Next's static-generation; on-demand revalidation when `Profiles.afterChange` fires (existing hook). | Spec note (incremental). v1 single-process; v2 splits into `/sitemap-N.xml` (out of scope). |
| 9 | Robots | `Allow: /` + `Disallow: /dashboard/`, `/admin/`, `/api/`, `/onboarding/`, `/login`, `/signup`, `/auth/`, `/dev/`, `/spike/`. Sitemap URL declared. | Spec AC. |
| 10 | Out of scope | `/explore` schema; per-locale URL routing; visualizing rich results in a CI step. | Spec scope-out + task-29. |

## Cross-references

- PRD §9 (SEO), §10 (i18n), §2 goal #3 (branded queries), §13 (perf — sitemap byte budget).
- task-19 (public route), task-29 (locale toggle — consumes `alternates.languages`).

## File inventory

### Pure helpers (TDD)
- `lib/seo/build-profile-metadata.ts` (+ test) — pure builder for the Next `Metadata` object.
- `lib/seo/build-profile-jsonld.ts` (+ test) — `MusicGroup` JSON-LD object.

### Routes
- `app/[slug]/page.tsx` — generateMetadata calls the new builder; the rendered tree adds the `<script type="application/ld+json">`.
- `app/sitemap.ts` — async function returning the published-profile list, paginated.
- `app/robots.ts` — static config.

### E2E + runbook
- `tests/e2e/public-profile-seo.spec.ts` — `@full` happy path: title + canonical + JSON-LD + sitemap + robots.
- `docs/runbooks/dev-editor.md` — append the SEO smoke recipe (Rich Results Test, sitemap inspection).

## Implementation sequence

1. **Plan doc** (this).
2. **`buildProfileJsonLd` (TDD).**
3. **`buildProfileMetadata` (TDD).**
4. **Wire `generateMetadata` + JSON-LD `<script>` in `app/[slug]/page.tsx`.**
5. **`app/sitemap.ts`** — paginated published profiles.
6. **`app/robots.ts`.**
7. **E2E + runbook + workspace log.**
8. **Verification (typecheck + suite).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Google Rich Results Test passes | Manual smoke documented in the runbook (Google's tester is gated behind their UI). |
| `/sitemap.xml` lists all published profiles | Sitemap unit test on a stub Payload deps fixture. |
| Lighthouse SEO ≥ 95 | Task-26 enforces; this task makes it possible. |
| Canonical URL never carries a locale segment | Builder test asserts the canonical matches `https://${host}/${slug}` regardless of `localesAvailable`. |
| `/dashboard/profile/123` is `Disallow`-ed | Robots unit test. |

## Test plan

- **Unit:** `buildProfileJsonLd` (sameAs assembly, dedup, falsy skip), `buildProfileMetadata` (title fallback, og fallback chain, twitter card type selection, alternates), sitemap deps stub (pagination), robots config (path inclusions/exclusions).
- **E2E:** `@full` — fetch the page, parse `<script type="application/ld+json">`, assert sitemap returns 200 with expected entries.

## Out of scope

- Per-locale URL routing — task-29.
- `/explore` schema — v2.
- Lighthouse SEO gate enforcement — task-26.

## Risks

- **R1 — Same-URL hreflang confuses crawlers.** Google's docs explicitly allow it; risk is minor. *Mitigation:* if it becomes an issue we can switch to `?lang=en` query-param URLs without code changes (the canonical stays bare).
- **R2 — Sitemap > 50k URLs.** Out of scope until v2; documented.
- **R3 — Outdated `lastModified`.** ISR caches the sitemap. *Mitigation:* on-demand revalidation when a Profile is published/unpublished; the existing afterChange hook already calls `revalidatePath('/<slug>')` — we add a `revalidatePath('/sitemap.xml')` peer.

## Done when

1. Pure helpers TDD green.
2. Public profile page emits `<script type="application/ld+json">` with valid `MusicGroup` schema.
3. `/sitemap.xml` returns 200 with all published profiles.
4. `/robots.txt` returns the right Allow/Disallow set.
5. Canonical URL stable across locales.
6. `pnpm test` + `pnpm typecheck` green.
7. Plan file (this doc) committed alongside implementation.
