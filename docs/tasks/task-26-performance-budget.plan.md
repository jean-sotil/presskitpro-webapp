# Task 26 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-26-performance-budget.md](./task-26-performance-budget.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §13 sets a hard performance budget — Lighthouse Performance ≥ 95 mobile, LCP < 2.5s, INP < 200ms, CLS < 0.1, public profile bytes < 600 KB excluding hero. Today nothing **enforces** that budget. Task-26 turns the targets from aspiration into a CI gate. Three patterns ship that future tasks rely on:

1. **Bundle baseline as committed file.** `bundles.lock.json` records the route-level First Load JS for every route. CI fails if any route exceeds its baseline by > 10 KB. The number is a real number — not a vibe.
2. **Lighthouse-CI assertion config**, gated on `bun run start` against the production build. Performance regressions ride PRs as ⨯ checks, not as morning-after surprises.
3. **`next/image` migration of the public-facing surfaces.** Hero portrait, logo, gallery thumbs ship with explicit `width`/`height`/`sizes` and a single `priority` element. Upload-preview `<img>` blobs stay (`createObjectURL` / data URLs aren't `next/image`-compatible) but get a documented eslint-disable.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Bundle budget mechanism | (C) `@next/bundle-analyzer` (local) + LHCI `resource-summary` assertions (CI) + `scripts/check-bundle-budget.ts` that diffs route sizes vs `bundles.lock.json`. All three. | Each one catches a different failure mode. The committed lock-file is what stops "+40 KB" PRs at review. |
| 2 | AVIF/WebP delivery | `next/image` built-in negotiation. The Next Image Optimizer serves AVIF when `Accept` allows, WebP otherwise. | Free with `next/image`; Supabase Storage transforms require Pro plan and aren't needed yet. Documented as v2 in `docs/runbooks/`. |
| 3 | `<img>` migration scope | Public-facing 4 sites → `<Image />`. Editor/upload 3 sites stay `<img>` with eslint-disable + comment justifying `URL.createObjectURL` / data-URL incompatibility. | Lighthouse only scores the public surface. Optimizing upload previews is wasted effort. |
| 4 | Edge cache | Set `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on `/[slug]` responses via the middleware that already runs there. Skip for `/api/*` and dashboard paths. | Layered with the existing ISR `revalidate = 3600`. Vercel edge holds a fresh page for 1h, serves stale up to 24h while regen runs. |
| 5 | LazyEmbed / LazyIframe audit | Both already use `IntersectionObserver` with 200px rootMargin (verified). No code change needed; document the contract in the plan + runbook so future embeds inherit it. | Spec compliant on inspection. |
| 6 | Font subsetting | Existing `lib/design/fonts.ts` already declares every face with `subsets: ['latin', 'latin-ext']`. No code change. The `Big Shoulders` font-override warning is a Next.js limitation on the variable optical-size axis — not a subsetting issue, not actionable. | Confirmed against the file. |
| 7 | LHCI config | `.lighthouserc.json` at repo root. Targets: Performance ≥ 95 mobile, LCP < 2500, INP < 200, CLS < 0.1, total transfer < 600 KB on `/<slug>`. `lhci autorun` invokes `bun run start` with a seeded URL. | Spec AC. The seed URL is configurable via `LHCI_TARGET_URL`; default is `http://localhost:3000/marina-clube`. |
| 8 | Bundle-size script | `scripts/check-bundle-budget.ts`: parses `.next/app-build-manifest.json` + `.next/server/app-paths-manifest.json` (or runs `next build --json`-equivalent), compares each route's First Load JS against `bundles.lock.json`. Fails CI on `>10 KB` over baseline OR new route without entry. | Same posture as `scripts/contrast-check.ts` from task-18. Pure node script, no extra deps. |
| 9 | Hero LCP | The portrait `<Image>` already exists in `HeroRender`. Add `priority` (only on the LCP element), explicit `sizes`, and explicit `width`/`height` from the Media doc when available; fallback to a 3:4 aspect ratio div otherwise. | Spec implementation note. |
| 10 | Out of scope | HTTP/3 push, every-font preload, Supabase Pro Storage transforms, `react-hooks/exhaustive-deps` cleanup in `ThemeTab.tsx` (pre-existing, separate fix). | Spec scope-out + cost/value. |

## Cross-references

- PRD §13 (Performance targets), §19 (success metrics), §18 risk #4 (LCP regression risk).
- task-04 (LHCI scaffold — `lhci autorun` already in `package.json`), task-19 (public profile route + ISR), task-25 (a11y baseline; we don't regress while migrating images).

## File inventory

### Config + tooling
- `next.config.ts` — wrap export in `withBundleAnalyzer` (gated on `ANALYZE=1`).
- `.lighthouserc.json` — full assertion config (perf ≥ 95, LCP/INP/CLS targets, total-byte budget).
- `bundles.lock.json` (root) — committed baseline of route-level First Load JS in KB.
- `scripts/check-bundle-budget.ts` — node script; reads the latest build manifest + the lock file, exits non-zero on regression.
- `package.json` — add `analyze`, `bundle:check`, `lighthouse:assert` scripts. Add `@next/bundle-analyzer` dev dep via bun.

### Public-image migration (4 sites)
- `components/profile/sections/HeroRender.tsx` — replace remaining `<img>` for logo (3 sites: published variant, paused variant fallback) with `<Image />`. Add `priority` to the portrait `<Image />` (LCP element), explicit `sizes`, fixed dimensions from `media.width/height` when present, fallback to 3:4 aspect-ratio container.
- `components/profile/sections/PhotoGalleryRender.tsx` — replace gallery `<img>` with `<Image />`. `loading="lazy"` is the default on non-priority images. Set `sizes="(min-width: 768px) 33vw, 100vw"`.

### Upload-preview migration (3 sites — eslint-disable + comment)
- `components/editor/sections/HeroEditCard.tsx:311` — preview of `URL.createObjectURL(file)`.
- `components/editor/gallery/GalleryItem.tsx:51` — sortable thumbnail using local blob URL.
- `app/onboarding/steps/MediaStep.tsx:182` — wizard preview using local blob URL.

### Edge cache
- `middleware.ts` — branch on `/[slug]` (after the existing skip-link / page-view beacon work) and add `Cache-Control` + `CDN-Cache-Control` headers to the response. Tests cover the header presence and exemption of `/dashboard`, `/api`, etc.

### Tests
- `scripts/check-bundle-budget.test.ts` — pure unit tests for the diff logic (no FS): under-budget ✓, over-budget ✗, new route without entry ✗.
- `tests/e2e/perf-headers.spec.ts` — `@smoke` Playwright assertion that `/[slug]` (or `/<seeded>`) returns the Cache-Control header.

### Runbook
- `docs/runbooks/dev-editor.md` — append a "Test the performance budget" recipe (`bun run analyze`, `bun run bundle:check`, `bun run lighthouse`).

## Implementation sequence

1. **Plan doc** (this).
2. **Bundle-analyzer wiring** + `analyze` script.
3. **`bundles.lock.json` initial baseline** (run `bun run build`, capture First Load JS per route).
4. **`scripts/check-bundle-budget.ts` (TDD) + `bundle:check` npm script.**
5. **`.lighthouserc.json` + `lighthouse:assert` script.**
6. **Public `<img>` → `<Image />` migration (4 sites).**
7. **Upload-preview `<img>` justifications (3 sites).**
8. **Edge cache middleware branch.**
9. **`perf-headers.spec.ts`.**
10. **Runbook recipe.**
11. **Verification (typecheck + tests + `bun run build`).**

## Acceptance evidence

| AC | How verified |
|---|---|
| LCP < 2.5s on Pixel 6 / 4G | Lighthouse-CI mobile run asserts `largest-contentful-paint <= 2500`. |
| INP < 200ms p75 | LHCI `interaction-to-next-paint <= 200` (Lighthouse uses TBT proxy in lab; PRD targets field INP — documented in the runbook). |
| CLS < 0.1 | LHCI `cumulative-layout-shift <= 0.1`. |
| Public profile route ships < 600KB excl. hero | LHCI `resource-summary:total:size <= 614400` minus the hero image bucket. Documented assumption: hero image is excluded by `resource-summary:image:size` not counting toward the total assertion (we set the total assertion at 1MB and rely on the script-+-stylesheet sub-budgets to enforce the 600 KB excl. hero). |
| Lighthouse-CI fails on Performance < 95 | LHCI `categories:performance >= 0.95`. |

## Test plan

- **Unit:** `check-bundle-budget` diff logic — pure function tests, no FS.
- **E2E (`@smoke`):** Cache-Control headers present on `/<seeded>`; absent on `/dashboard` and `/api/track`.
- **Manual:** `bun run analyze` opens the analyzer; `bun run lighthouse` runs LHCI against the local prod build; the score landing page reports ≥ 95.

## Out of scope

- HTTP/3, font preloads beyond what `font-display: swap` does (PRD scope-out).
- Supabase Storage transformations (Pro plan; v2).
- `react-hooks/exhaustive-deps` cleanup in `ThemeTab.tsx` (pre-existing; one-shot follow-up).
- Real-device WebPageTest runs (LHCI lab proxy is the v1 gate).
- Per-route differential bundle analysis beyond First Load JS (e.g. CSS budgets) — v2.

## Risks

- **R1 — Lock-file becomes stale.** Devs forget to update it after a legitimate addition. *Mitigation:* the script's failure message includes the exact `bun run bundle:check --update` command. The lock file is treated as a regen artifact, not a hand-edited file.
- **R2 — `next/image` adds layout shift.** Without explicit dimensions, hero images can flash a different size after hydration. *Mitigation:* every `<Image />` we add carries `width`/`height` from the Media doc OR sits inside an aspect-ratio container with fixed `aspect-ratio` CSS.
- **R3 — Edge cache + dashboard path.** A misconfigured matcher could let `Cache-Control: public, s-maxage=…` leak to a `/dashboard/*` response, caching authenticated content at the edge. *Mitigation:* the middleware branch sets headers ONLY when the path matches the slug pattern (and is not in the reserved list); `perf-headers.spec.ts` asserts the negative for `/dashboard`.
- **R4 — Bundle script flake on a fresh `.next/`.** Running `bundle:check` before `bun run build` produces a confusing error. *Mitigation:* the script reports "build manifest not found — run `bun run build` first" with exit 2, distinct from the regression-fail exit 1.

## Done when

1. `bun run analyze` opens the bundle analyzer in the browser.
2. `bundles.lock.json` committed with current First Load JS per route.
3. `bun run bundle:check` returns 0 on the committed lock; non-zero when a route grows > 10 KB or appears without an entry.
4. `.lighthouserc.json` committed; `bun run lighthouse` runs LHCI against the local prod build with the spec targets asserted.
5. Public-facing `<img>` sites in `HeroRender` (3) + `PhotoGalleryRender` (1) migrated to `<Image />` with explicit dimensions + `priority` on the LCP element.
6. Upload-preview `<img>` sites in `HeroEditCard`, `GalleryItem`, `MediaStep` carry the eslint-disable comment with a one-line justification.
7. `/[slug]` responses include `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`. `/dashboard` and `/api/*` do NOT.
8. `bun run typecheck` + `bun run test` + `bun run build` all green. `tests/e2e/perf-headers.spec.ts` green.
9. Plan file (this doc) committed alongside implementation.
