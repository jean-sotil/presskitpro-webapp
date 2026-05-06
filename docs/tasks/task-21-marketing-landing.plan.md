# Task 21 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-21-marketing-landing.md](./task-21-marketing-landing.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

The marketing landing is the product's funnel mouth. Three patterns get exercised here that downstream tasks (pricing in task-22, locale toggle in task-29) reuse:

1. **String-key-shaped copy.** Every visible string lives in `lib/marketing/copy.ts` keyed by section + slot. Components reference `copy.hero.title`, never inline strings. Task-29 maps the same key tree onto next-intl's catalog with a one-line swap (`copy.X` → `t('X')`); no component churn.
2. **No Supabase client until signup.** The marketing page is a pure RSC tree — no auth bootstrap, no React Query provider, no client-fetched bundle. Pure perf budget; supports Lighthouse ≥ 95.
3. **`prefers-reduced-motion` gate for autoplay.** The live-examples carousel auto-advances every 5s only when the user hasn't requested reduced motion. Implemented via `matchMedia` on first mount; the same pattern lands on any future motion surface.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Server-first composition | `app/page.tsx` is a server component composing seven section components. Only the carousel and FAQ accordion are clients (autoplay state + native `<details>` doesn't quite cover keyboard/aria expectations). | Smallest possible JS bundle on the funnel mouth. |
| 2 | Copy lookup | Single PT-BR object exported from `lib/marketing/copy.ts`. Task-29's swap converts the same keys to a `messages.json` catalog read via `next-intl`. The file lives under `lib/marketing/` because it's shared between server + client components. | Spec AC ("All copy translatable"). |
| 3 | Live examples source | `loadLiveExamples({ limit: 8 })` calls `payload.find('profiles', { status: 'published', sort: '-updatedAt' })` with `overrideAccess: true`. Returns `{ slug, displayName, portrait }` minimal projection — no full bundle. | Spec scope ("5–10 seeded demo profiles"). Cheap query; cached by ISR. |
| 4 | Carousel | Native CSS scroll-snap horizontal list. The autoplay client component nudges `scrollLeft` by one card width every 5s when `matchMedia('(prefers-reduced-motion: no-preference)').matches`. Pause on hover/focus/touch. | No new JS deps; respects spec AC. |
| 5 | FAQ | `<details>` elements with `aria-expanded` from CSS `[open]`. No JS for v1 — the native primitive handles toggle + a11y. The "client" requirement comes off; this stays SSR. | Save bytes; native a11y is correct. |
| 6 | Pricing teaser | Single card with the headline price (R$ 19/mês teaser per PRD §6.1) and a CTA to `/pricing`. The link 404s until task-22 ships — runbook documents this. | Spec scope (links to `/pricing`, owned by task-22). |
| 7 | Hero CTA | `<Link href="/signup">` rendered as the primary `<Button>` variant. No client JS, prefetches by default. | Spec AC (one tap to signup). |
| 8 | Footer | Server-rendered links + a non-functional language toggle (PT/EN buttons that are inert until task-29). The copy keys exist in `copy.footer.lang.{pt,en}` so wiring is one swap. | Spec scope ("language toggle (PT/EN — task-29 wires the actual locale)"). |
| 9 | Out of scope | Pricing details (task-22), blog content (PRD non-goal), live locale switching (task-29), Lighthouse gate enforcement (task-26). | Spec scope-out. |

## Cross-references

- PRD §6.1 (marketing site), §3 (personas), §4 (visitor stories), §13 (perf), §10 (i18n).
- task-03 (design tokens), task-19 (live profile route — examples link here), task-22 (pricing page), task-26 (perf budget enforcement), task-29 (locale toggle).

## File inventory

### Centralized copy
- `lib/marketing/copy.ts` — PT-BR strings keyed by section.

### Server-side helpers (TDD)
- `lib/marketing/fetch-live-examples.ts` (+ test) — DI-shaped `loadLiveExamples({ find, limit })`. Live wiring in the page.

### Components
- `components/marketing/MarketingHero.tsx` — H1, tagline, CTA → `/signup`.
- `components/marketing/WhatIsPressKit.tsx` — explainer block.
- `components/marketing/HowItWorks.tsx` — 3 numbered steps.
- `components/marketing/LiveExamplesCarousel.tsx` (client) + `.test.tsx` — CSS scroll-snap list + reduced-motion-gated autoplay.
- `components/marketing/PricingTeaser.tsx` — single card with CTA to `/pricing`.
- `components/marketing/FaqAccordion.tsx` — server-rendered `<details>` list.
- `components/marketing/MarketingFooter.tsx` — links + lang toggle.

### Page
- `app/page.tsx` — composes the seven sections.

### E2E + runbook
- `tests/e2e/marketing-landing.spec.ts` — `@full` happy path: visit `/`, click hero CTA → lands on `/signup`.
- `docs/runbooks/dev-editor.md` — append the marketing-landing recipe.

## Implementation sequence

1. **Plan doc** (this).
2. **`lib/marketing/copy.ts`** — strings.
3. **`fetch-live-examples` (TDD)**.
4. **Server-side sections** (Hero, WhatIs, HowItWorks, PricingTeaser, FAQ, Footer).
5. **LiveExamplesCarousel (TDD client).**
6. **Compose `app/page.tsx`.**
7. **E2E + runbook + workspace log.**
8. **Verification (typecheck + suite).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Click-through to signup is one tap | E2E test asserts the hero CTA links to `/signup` and visiting it lands. |
| All copy translatable | Every visible string sourced from `copy.*`; the file is the single source of truth. |
| Carousel autoplays only when reduced-motion is no-preference | Carousel test asserts `setInterval` is not called when `matchMedia('(prefers-reduced-motion: reduce)').matches === true`, and IS called when false. |
| Lighthouse mobile ≥ 95 (Perf, A11y) | Task-26 enforces; this task makes it possible (server-first, no client deps). |

## Test plan

- **Unit:** `loadLiveExamples` (limit + sort + only published), `LiveExamplesCarousel` (autoplay gate, pause-on-hover semantics if implemented).
- **Component:** FAQ renders n questions; PricingTeaser links to `/pricing`; Hero CTA links to `/signup`.
- **E2E:** `@full` happy path visits `/` and clicks through to signup.

## Out of scope

- Pricing details (task-22).
- Blog / long-form content.
- Real locale switching (task-29).
- Lighthouse gate enforcement (task-26).

## Risks

- **R1 — `/pricing` 404s.** Hero teaser links to a route that doesn't exist until task-22. *Mitigation:* document in runbook; the click still gets visitors who'll see the standard 404. Acceptable for the dev period.
- **R2 — Empty live-examples grid in fresh dev DBs.** No published profiles → carousel renders an empty state. *Mitigation:* the carousel's empty state copy points the dev at `pnpm seed`.
- **R3 — Locale toggle visually misleading.** It's inert until task-29; users may think the toggle is broken. *Mitigation:* it's labelled with the current locale (PT-BR active) and a `title="Em breve"` hint.

## Done when

1. `/` renders the seven sections.
2. Hero CTA navigates to `/signup` with one tap.
3. Carousel autoplays when reduced-motion is no-preference; freezes when it isn't.
4. FAQ items expand/collapse via the native `<details>` primitive.
5. All visible copy lives under `copy.*`; no inline strings in components.
6. `pnpm test` + `pnpm typecheck` green; e2e `@full` green.
7. Plan file (this doc) committed alongside implementation.
