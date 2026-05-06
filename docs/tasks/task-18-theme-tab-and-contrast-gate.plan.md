# Task 18 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-18-theme-tab-and-contrast-gate.md](./task-18-theme-tab-and-contrast-gate.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Task-18 is the editor's first **per-profile design** surface and the project's first **server-enforced a11y gate**. Two patterns get exercised here that downstream tasks (public route in task-19, accessibility baseline in task-25) reuse:

1. **Server-enforced contrast bump.** `Themes.contrastValidatedAt` is the publish gate. The editor can run validation client-side for instant feedback, but the source of truth is server-side: the theme PATCH route re-derives tokens after every save and bumps `contrastValidatedAt` only when contrast passes. Publish reads that timestamp; null/stale → 422. A bypassed editor can't ship an inaccessible profile.
2. **Theme injection at SSR.** Public render emits a `<style>` tag in `<head>` with the per-profile CSS variables (`--bg`, `--accent`, etc.). No client-side theme recomputation; the cascade is the source of truth. Same pattern is reused by task-19 for the public profile route.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Token derivation | Pure helper `deriveThemeTokens(theme)` returns `{ bg, accent, text, accentContrast }` as hex. Order: per-field custom hex (when present) → preset values (when `colorPresetId`/etc. set) → defaults. Auto-derives `text` from `bg` luminance when omitted (using `autoText` from `lib/design/tokens.ts`). | Single source of truth for "what would the page actually render". The route, the editor, and the SSR injector all call the same function. |
| 2 | Contrast validation | `validateThemeContrast(tokens)` runs `contrastRatio(text, bg)` (must ≥ 4.5) and `contrastRatio(accent, bg)` (must ≥ 3). Returns `{ ok, ratios: { textBg, accentBg } }`. | Spec AC + WCAG 2.1 SC 1.4.3 / 1.4.11. |
| 3 | Server gate | `contrastValidatedAt` is removed from `PATCHABLE` (was previously trusted from the client). After every theme upsert the route re-runs `validateThemeContrast`; on pass, second update bumps `contrastValidatedAt`; on fail, the field stays untouched (so the user keeps iterating but the "freshness clock" doesn't reset). | Server is the only thing that bumps the gate. Closes the bypass hole. |
| 4 | Publish gate | `publishProfile` (and the route handler) reads `theme.contrastValidatedAt`. Reject (`422 contrast-stale`) if null or > 30 days. Editor surfaces the rejection via the publish dialog: "Re-validate the theme before publishing" + a deep link to the Theme tab. | Spec AC. |
| 5 | Custom hex inputs | Use native `<input type="color">` for visual picker + a sibling `<input type="text">` that accepts a 6-digit hex. Auto-sync. Validate at the editor — invalid hex blocks the picker apply. | Native pickers are good enough for v1; no extra dependency. |
| 6 | Editor placement | New tab strip above the rail+EditCard column: **Seções** / **Tema**. Active tab swaps the left column's content; the right (preview) pane is unchanged. Mobile tabs (existing) gain a "Tema" entry for the same toggle. | Theme is a global per-profile concern; living next to (not inside) the section rail keeps the "what changes affect what" mental model clean. |
| 7 | Theme CSS injection | `ProfileRenderer` accepts the bundle and emits a `<style>` element at the top of its tree with `:root { --bg: <hex>; --accent: <hex>; --accent-contrast: <hex>; --text: <hex>; }`. Runs identical in `mode="preview"` and `mode="public"`. | Spec AC ("CSS-variable injection in `<head>`"). The tag is rendered once at the top of the article tree; in the public route (task-19) it's hoisted to `<head>` via the standard mechanism. |
| 8 | Live preview | The editor's `qc.setQueryData` already updates `bundle.theme` optimistically; the existing right-pane mount picks up the new tokens automatically. No special wiring. | Free reuse of the autosave pipeline. |
| 9 | Out of scope | Custom CSS / token overrides beyond what the schema supports (v2). User-uploaded fonts (v2). | Spec scope-out. |

## Cross-references

- PRD §12.2 (per-profile theme tokens), §12.3 (constraints), §11 (a11y), §14 (publish gates).
- task-03 (design tokens + presets), task-08 (Themes schema + access), task-09 (autosave + theme PATCH), task-19 (public route — consumes the same `<style>` injection), task-25 (accessibility baseline — surfaces the gate in CI).

## File inventory

### Pure helpers (TDD)
- `lib/design/derive-theme-tokens.ts` (+ test) — `deriveThemeTokens(theme)` returns the canonical hex set.
- `lib/design/validate-theme-contrast.ts` (+ test) — wraps `contrastRatio` for the two AA pairs; returns ratios + pass.

### REST routes
- `app/api/profiles/[id]/theme/route.ts` — drop `contrastValidatedAt` from the PATCHABLE allow-list; after upsert, re-derive + validate; bump `contrastValidatedAt` on pass.
- `app/api/profiles/[id]/publish/route.ts` — short-circuit with `422 contrast-stale` when the theme gate fails.
- `lib/editor/bundle.ts` — extend `publishProfile` to accept a "stale-after-ms" param + thread the rejection.

### Editor
- `components/editor/ThemeTab.tsx` (+ test) — color/preset grid + custom hex + font cards + hero/gallery switchers + live contrast indicator.
- `components/editor/ThemeTabs.tsx` (or inline in `EditorClient.tsx`) — Sections / Tema strip.
- `app/dashboard/profile/[id]/EditorClient.tsx` — add tab state, render either `editPaneEl` or `themeTabEl`. Surface the publish-gate rejection in the publish dialog flow.

### Public renderer
- `components/profile/ProfileRenderer.tsx` — derive tokens via the helper, emit a `<style>` tag at the top of the tree.

### E2E + runbook
- `tests/e2e/editor-theme.spec.ts` — `@full` happy path (switch preset, switch font, switch hero, save).
- `docs/runbooks/dev-editor.md` — append the Theme recipe + how the contrast gate works.

## Implementation sequence

1. **Plan doc** (this).
2. **Pure helpers (TDD)** — `derive-theme-tokens`, `validate-theme-contrast`.
3. **Theme PATCH server bump** + tests via DI.
4. **Publish gate** + tests.
5. **ThemeTab UI (TDD).**
6. **EditorClient tab state.**
7. **ProfileRenderer style tag injection** + tests.
8. **E2E + runbook.**

## Acceptance evidence

| AC | How verified |
|---|---|
| Low-contrast custom hex pair surfaces inline error with exact ratio | ThemeTab test renders custom `bg=#ffffff accent=#ffffff`; assert the ratio (1.0) and the `role="alert"` text are visible. |
| Switching font pair updates the preview without reload | `applyMutation('theme', { fontPairId })` already triggers `setQueryData`; PreviewPane re-renders. Asserted via integration test (re-render of `<ProfileRenderer>` with new theme picks up the new fontPairId-derived class). |
| Theme record persists `colorPresetId` when preset chosen, raw hex when custom | ThemeTab test on preset click → expect `applyMutation` payload `{ colorPresetId, bg: undefined, accent: undefined, text: undefined }`. On custom hex → `{ colorPresetId: '', bg: '#abc...', accent: '#def...' }`. |
| Public page renders theme via CSS-variable injection in `<head>` | ProfileRenderer test asserts the rendered tree contains a `<style>` element with `:root { --bg: ... }`. Task-19 hoists it into `<head>`. |

## Test plan

- **Unit:** `deriveThemeTokens` (preset, custom, mixed, defaults), `validateThemeContrast` (pass/fail thresholds), theme route handler (server bump on pass, no-bump on fail), publish gate (null/stale rejection).
- **Component:** ThemeTab (preset selection, custom hex, contrast indicator pass/fail, font + layout switchers).
- **Integration:** ProfileRenderer style tag injection — visible in DOM, correct values, isolated to the rendered article so different profiles don't bleed.
- **E2E:** `@full` happy path — switch a preset, see preview update, save, refresh, persists.

## Out of scope

- Custom CSS / token overrides beyond the schema — v2.
- User-uploaded fonts — v2.
- Detailed Lighthouse/Axe gates — task-25.

## Risks

- **R1 — User picks a custom hex pair that passes locally but fails server-side** (e.g. browser color picker emits a slightly different hex than what the server canonicalizes). *Mitigation:* the editor calls `validateThemeContrast` on the same canonical form (uppercase 6-digit hex) the server uses; the helper is pure and shared.
- **R2 — Stale gate after font/layout-only changes** (cosmetic edits don't touch colors but reset the timer). *Mitigation:* the server only bumps `contrastValidatedAt` when validation passes after a PATCH that *touched colors* (`bg`, `accent`, `text`, `colorPresetId`). Non-color PATCHes leave the timestamp alone.
- **R3 — `contrastValidatedAt` set in the past during initial profile creation, then > 30 days later the user opens the Theme tab and sees "stale" without changing anything.** *Mitigation:* the editor surfaces "Re-validate" inline on the Theme tab; one click triggers a no-op color save that bumps the timestamp.
- **R4 — `<style>` element repeated across SSR renders.** *Mitigation:* keyed by profile id; React renders one per `ProfileRenderer` mount. Public route mounts only one.

## Done when

1. Pure helpers TDD green.
2. Theme PATCH route bumps `contrastValidatedAt` on pass, leaves stale on fail.
3. Publish route returns 422 on null/stale gate.
4. ThemeTab: live contrast ratios visible, save blocked when text/bg < 4.5 or accent/bg < 3.
5. Preview pane reflects color/font/hero/gallery changes without reload.
6. Public render (preview mode) includes the `<style>` tag with correct CSS variables.
7. `pnpm test` + `pnpm typecheck` green; e2e `@full` green.
8. Plan file (this doc) committed alongside implementation.
