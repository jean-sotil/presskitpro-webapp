# Task 25 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-25-accessibility-baseline.md](./task-25-accessibility-baseline.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

A11y is not a tax we pay at the end — it is the quality bar the product is built to. PressKit Pro's audience includes artists who use screen readers, who navigate by keyboard, who set `prefers-reduced-motion`. Task-25 is the first **horizontal sweep** since the project started; it converts the "we mean it" claim in PRD §11 into automated proof on every CI tick.

Three structural firsts get exercised:

1. **Site-wide invariants in the root layout.** Skip-to-content + correct `lang` go in [app/layout.tsx](app/layout.tsx) once, not in 14 page files. Future routes inherit them.
2. **Axe coverage as a CI gate, not a smoke check.** Today axe runs on `/login`, `/signup`, and the marketing landing only. After this task, every route surface in the inventory has its own axe assertion.
3. **`docs/qa/a11y-passes/` convention.** Manual screen-reader passes (NVDA / VoiceOver) are checked in as dated markdown logs per release tag — turning a mushy "we did some testing" into auditable artifacts.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Audit scope | Every route group: marketing, auth, onboarding, checkout, dashboard, public profile, paused template. | Spec calls task-25 a "baseline" — partial coverage is a non-baseline. |
| 2 | `<html lang>` | Flip root layout to `lang="pt-BR"`. Task-29 swaps in dynamic detection later. | PRD §10 — PT-BR is the v1 locale. Axe `html-has-lang` and `html-lang-valid` rules pass on the actual content language. |
| 3 | Skip-link placement | One `<SkipToContent>` in [app/layout.tsx](app/layout.tsx). Targets `#main`. Every route's top-level wrapper exposes that id. | Single source of truth; new routes inherit it automatically. |
| 4 | `<main>` id discipline | Every existing `<main>` element gains `id="main"`. New components default to it. | Required for the skip-link target. Existing routes already have a `<main>` so this is a sweep, not a rewrite. |
| 5 | Axe coverage | One spec file per route group in `tests/e2e/a11y-*.spec.ts`. Each test loads the route, runs `expectAxeClean()`, and asserts the keyboard-tab order on key controls where appropriate. | Keeps the file count small; lets devs run `bun test:e2e tests/e2e/a11y-*` to slice the a11y subset. |
| 6 | Keyboard publish flow | One Playwright test in `tests/e2e/a11y-publish-flow.spec.ts`, tagged `@full`. Drives the existing publish path with `Tab`/`Enter` only. Skipped when `STRIPE_SECRET_KEY` etc. aren't set. | Spec AC requires "Keyboard-only Playwright run completes the publish flow." Real test, gated on the seed env so CI doesn't flake on missing secrets. |
| 7 | `prefers-reduced-motion` | Status check, not a rewrite. Existing call sites in `Grain`, `RevealStagger`, `LiveExamplesCarousel`, `AnchorNav`, `globals.css` are already correct (verified). The audit confirms no animations slipped through without a gate. | A `motion-audit.ts` script greps for `transition`/`animate-` outside reduced-motion gates and warns. Out of scope for this task to add — flagged in v2 backlog. |
| 8 | `.axe-suppressions.md` | Create empty with a one-line "Add justifications here" header. Convention: every disabled rule must reference an entry. | Forces the team to write *why* before suppressing. |
| 9 | Form `aria-invalid` + `role="alert"` | Audit existing forms (login, signup, contact form, every editor section). Add where missing. | Spec AC. The contact-form on the public profile is the one user-facing form most likely to be missing this. |
| 10 | `<iframe>` titles | Existing embeds (SoundCloud, Instagram, contact-form Turnstile) audited for descriptive `title=` attributes. | Already addressed in `LazyEmbed` per task-16/17 — verify, don't rewrite. |
| 11 | Out of scope | WCAG AAA contrast (we target AA per PRD §11). The contrast-gate-on-save (task-18) covers profile theme; chrome-layer contrast is verified manually against design tokens. Sign-language alternatives. The `motion-audit.ts` lint script. | Spec scope-out + cost/value. |

## Cross-references

- PRD §11 (Accessibility), §19 (zero critical axe violations), Appendix C (axe in DoD).
- task-04 (axe in CI — we're extending its coverage), task-09 (editor shell), task-18 (contrast gate at save), task-19 (public profile), task-29 (i18n, will revisit `lang`).

## File inventory

### New shared chrome
- `components/ui/SkipToContent.tsx` (+ test) — accessible skip-link. Hidden until focused; jumps to `#main`. Render once in the root layout.
- `app/layout.tsx` — flip `lang` to `pt-BR`, mount `<SkipToContent />`, ensure body wraps children in a `<>` so the skip-link can sit before `<main>`.

### Root-layout fanout
For each top-level page that renders a `<main>`, ensure the element carries `id="main"`. Sweep:
- `app/page.tsx`, `app/pricing/page.tsx`
- `app/login/page.tsx`, `app/signup/page.tsx`
- `app/onboarding/*/page.tsx` (all wizard steps)
- `app/checkout/[planId]/page.tsx`, `app/checkout/success/page.tsx`, `app/checkout/canceled/page.tsx`
- `app/dashboard/page.tsx`, `app/dashboard/analytics/page.tsx`, `app/dashboard/profile/[id]/page.tsx`
- `app/[slug]/page.tsx` (public profile + paused branch + PausedTemplate)

### Forms — `aria-invalid` + `role="alert"` audit
- `app/login/page.tsx`, `app/signup/page.tsx` (Supabase OTP flows)
- `app/onboarding/*/page.tsx` (5 wizard steps)
- `components/profile/sections/ContactForm.tsx`
- `components/editor/sections/*EditCard.tsx` (audit, fix where needed)

### Axe e2e coverage
- `tests/e2e/a11y-marketing.spec.ts` — `/`, `/pricing`.
- `tests/e2e/a11y-auth.spec.ts` — `/login`, `/signup`. (Existing `auth.spec.ts` already has axe; this file consolidates.)
- `tests/e2e/a11y-onboarding.spec.ts` — wizard steps 1–5. Stubs Supabase/auth so the test runs without seed.
- `tests/e2e/a11y-checkout.spec.ts` — `/checkout/canceled`, `/checkout/success`, `/checkout/pro-monthly` (anonymous → redirect target).
- `tests/e2e/a11y-dashboard.spec.ts` — `/dashboard`, `/dashboard/analytics`, `/dashboard/profile/[id]` (anonymous redirects). `@full` extensions log in with the seed user and run axe inside the editor.
- `tests/e2e/a11y-public-profile.spec.ts` — `/<seeded-slug>`, paused template route. Default theme.
- `tests/e2e/a11y-publish-flow.spec.ts` — `@full` keyboard-only walkthrough: from `/dashboard`, Tab/Enter into the editor, fill required content, run contrast gate, hit Publish, verify the public URL.

### Suppressions log
- `.axe-suppressions.md` — empty header file. Convention: each entry is `## <route>: <rule-id>` followed by the justification + a date.

### QA pass log convention
- `docs/qa/a11y-passes/README.md` — explains the format ("dated markdown per release tag, summarising NVDA + VoiceOver paths and any blockers"). One stub `2026-05-task-25.md` for the current sweep.

## Implementation sequence

1. **Plan doc** (this).
2. **`<SkipToContent>` component (TDD).**
3. **Root layout — flip `lang`, mount skip-link.**
4. **`<main id="main">` sweep across all top-level pages.**
5. **`.axe-suppressions.md` + `docs/qa/a11y-passes/README.md` + first stub.**
6. **Axe e2e suite — write each spec, run it locally, fix violations as they surface.**
7. **Form `aria-invalid` + `role="alert"` audit.**
8. **Keyboard publish-flow `@full` test.**
9. **Verification (typecheck + unit tests + axe e2e suite).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Zero critical/serious axe violations on key routes | `bun run test:e2e tests/e2e/a11y-*.spec.ts` returns green. The `expectAxeClean` fixture asserts on every spec. |
| Keyboard-only Playwright run completes the publish flow | `bun run test:e2e tests/e2e/a11y-publish-flow.spec.ts --grep @full` (with seed env set) returns green. Test reaches the published `/<slug>` URL via Tab/Enter only. |
| Color contrast against the default theme passes 4.5:1 (text) and 3:1 (UI) | The default theme tokens (in `lib/design/tokens.ts` etc.) already pass the existing contrast checker (`scripts/contrast-check.ts`). Re-run as part of the audit. |
| Screen-reader pass log committed | `docs/qa/a11y-passes/2026-05-task-25.md` lands with this PR. |

## Test plan

- **Unit:** `<SkipToContent>` rendering + visibility-on-focus behavior. (Pure component test with `@testing-library/react`.)
- **E2E `@smoke`:** every route in the inventory loads + passes `expectAxeClean()` with no auth. Forms with submit affordances tab to the submit button in <10 keystrokes.
- **E2E `@full`:** publish-flow walkthrough; `/<slug>` axe pass with a real published profile.

## Out of scope

- WCAG AAA contrast (we target AA).
- Sign-language video alternatives (PRD scope-out).
- Reduced-motion lint script (deferred — existing call sites are correct).
- Per-locale a11y for English (task-29 i18n).
- Stress-testing axe `moderate`/`minor` violations (we surface, don't fail — by design in `expectAxeClean`).

## Risks

- **R1 — Existing components fail axe in unexpected ways.** A real audit always surfaces some breakage. *Mitigation:* fix as they surface, don't suppress without a `.axe-suppressions.md` entry. Bound the blast radius by reviewing the diff per page.
- **R2 — Editor surfaces are deep.** The profile editor has many `EditCard` components, some with custom keyboard handling (drag-reorder gallery, etc.). *Mitigation:* the `@full` editor axe pass covers the assembled view; per-card unit tests stay green via existing testing-library specs. Drag handlers are out of scope for keyboard fallback if they have non-drag alternatives — verify each.
- **R3 — Stripe checkout surface is off-domain.** We can't axe-check Stripe Checkout. *Mitigation:* document in the runbook; only assert axe on our entry card.
- **R4 — Reduced-motion call sites drift over time.** Future PRs can add animations without a gate. *Mitigation:* flagged in v2 backlog as a lint script (out of scope here).

## Done when

1. `<SkipToContent>` lands; root layout has `lang="pt-BR"` and the skip-link mounted.
2. Every top-level page exposes `id="main"` on its `<main>`.
3. `.axe-suppressions.md` + `docs/qa/a11y-passes/README.md` + dated pass-log stub committed.
4. `tests/e2e/a11y-*.spec.ts` files exist, pass `expectAxeClean()` on every listed route, and run green locally.
5. Keyboard publish-flow `@full` test exists and passes against the seed environment.
6. All form inputs in the inventory have correct `<label>` association, `aria-invalid` toggling, and inline error containers with `role="alert"`.
7. `bun run test` + `bun run typecheck` green; `bun run test:e2e tests/e2e/a11y-*.spec.ts` green.
8. Plan file (this doc) committed alongside implementation.
