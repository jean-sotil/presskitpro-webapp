# Task 03 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-03-design-tokens-editorial-nightlife.md](./task-03-design-tokens-editorial-nightlife.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Task-03 is the visual foundation every downstream feature consumes. PRD §12 specifies the tokens; this plan turns them into runnable CSS, Tailwind config, fonts, primitive components, and a lint script. Most decisions are already locked in §12 — what remains is implementation choice (color space, font loader, preview surface, contrast tool).

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Component preview surface | **`app/dev/preview/page.tsx` gated by `NODE_ENV !== 'production'`** | Lightweight, no Storybook tooling burden. Fits Next.js conventions. |
| 2 | Color space | **OKLCH** in CSS vars | Perceptual lightness; clean derivation of `--text` from `--bg`. ~95% browser support. |
| 3 | Tailwind | **Stay on v3.4** | Already installed; v4 rewrite isn't free. Use CSS vars via `theme.extend` mapping. |
| 4 | `<Grain />` | **PNG noise tile, `position: fixed`, `mix-blend-mode: overlay`** | One small asset, GPU-cheap, predictable. SVG `<feTurbulence>` defers to a future polish pass. |
| 5 | Contrast lint | **`scripts/contrast-check.ts` using `culori`** for OKLCH→Lab→ΔL contrast math. Wired as `pnpm contrast:check`. | Catches WCAG regressions when presets change. CI-ready. |
| 6 | Primitives source | **Build from scratch** (Button, Card, Section, Anchor, Tag, IconButton) | shadcn defaults fight `--radius: 0` and the editorial vibe. Six tiny components. |

## Cross-references

- PRD §12.1 — default tokens table (colors, fonts, radius, grain).
- PRD §12.2 — 8 font pairs + customizable axis.
- PRD §12.3 — save-time contrast constraints (text vs bg ≥ 4.5:1, accent vs bg ≥ 3:1).
- PRD §11 — a11y commitments (WCAG 2.2 AA, focus rings, reduced motion, semantic landmarks).
- Frontend-design skill — anti-AI mandate, 60-30-10 color rule, physics-based motion, no `ease-in-out`, noise overlay required.

## File inventory (deliverables)

### Tokens
- `app/globals.css` (modify) — `:root` block with all §12.1 vars in OKLCH; `@media (prefers-reduced-motion: reduce)` block.
- `tailwind.config.ts` (modify) — extend `colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`. Reference CSS vars via `colors: { bg: 'oklch(var(--bg) / <alpha-value>)' }` pattern.
- `lib/design/tokens.ts` (new) — TS export of token names + the contrast preset matrix (6 bg × 12 accent). Single source of truth for `contrast-check.ts`.

### Typography
- `app/fonts.ts` (new) — `next/font/google` loaders for the 8 pairs, each `{ subsets: ['latin', 'latin-ext'], display: 'swap' }`. Export `themeFonts` map keyed by pair name.
- `app/layout.tsx` (modify) — apply default pair (Anton + Manrope + Fraunces) via `<html className={...}>`. Other pairs are loaded but only emit CSS vars when a profile selects them (task-18 wires the switch).

### Primitives (`components/ui/`)
- `Button.tsx` — variants: `primary | ghost | link`. Sizes: `sm | md | lg`. Uses `--accent`. Sharp edges, `:focus-visible` ring.
- `Card.tsx` — `--surface` background, `--border` hairline. No shadow by default (editorial flat).
- `Section.tsx` — semantic `<section>` with vertical rhythm; consumes `<SectionMarker />`.
- `Anchor.tsx` — link with `--accent` underline-on-hover; honors visited state.
- `Tag.tsx` — small pill (radius still 0; just padding + bordered).
- `IconButton.tsx` — square 44px touch target (Fitts's Law); naked icons banned per skill.

### Atmosphere (`components/atmosphere/`)
- `Grain.tsx` — fixed-position div with PNG noise tile + `--grain-opacity`. Disabled when `prefers-reduced-motion`.
- `SectionMarker.tsx` — `<span aria-hidden>01</span> — <span>SOBRE</span>`. Uses `--font-display`. Decorative; the actual heading is its sibling.
- `RevealStagger.tsx` (client) — wraps children, applies `view()` scroll-driven CSS animation with 40ms stagger via `--index`. No JS spring lib for this; native CSS.

### Static asset
- `public/grain.png` (new) — 200×200 noise tile. Generated once locally and committed.

### Contrast lint
- `scripts/contrast-check.ts` (new) — reads `lib/design/tokens.ts`, computes WCAG ratio for every preset combo, exits non-zero on AA fail.
- `package.json` (modify) — add `"contrast:check": "tsx scripts/contrast-check.ts"`.

### Preview surface
- `app/dev/preview/page.tsx` (new) — server component; `if (process.env.NODE_ENV === 'production') notFound()`. Renders every primitive in every variant + every theme pair.
- `app/dev/preview/theme-switcher.tsx` (client) — toggles a `data-theme="<pair>"` attribute on `<html>` for visual sanity-check.

### Documentation
- `docs/design-system.md` (new, DoD requirement) — token table, font-pair list, primitive API, contrast policy, reduced-motion behavior, how to add a preset.

### Lint plumbing
- `package.json` deps: `culori`, `eslint-plugin-tailwindcss`, `tsx` (already a transitive dep but pin).
- `.eslintrc.json` (modify) — extend `plugin:tailwindcss/recommended`.

## Implementation sequence

1. **Tokens land first** — CSS vars + Tailwind extension + `lib/design/tokens.ts`. No components yet.
2. **Fonts** — `app/fonts.ts` + default pair applied in root layout. Validate PT-BR diacritics for each pair (manual: load each at `/dev/preview` and inspect "ã/ç/ô" rendering).
3. **Primitives** — six components in dependency order: Button → Anchor → Tag → IconButton → Card → Section. Each gets a unit test (Vitest + RTL) verifying it renders and applies its variant classes.
4. **Atmosphere** — `<Grain />`, `<SectionMarker />`, `<RevealStagger />`. Grain test confirms it disappears when `prefers-reduced-motion` is on.
5. **Preview route** — assemble showcase. This is the manual-QA surface.
6. **Contrast script** — implement, run against the 6×12 matrix, fix any failing presets in tokens.ts. Wire `pnpm contrast:check` into the verify matrix.
7. **Docs** — `docs/design-system.md` written last so it reflects what actually shipped.

## Acceptance evidence (Verification Matrix)

| AC (from task) | Command / check | Expected |
|---|---|---|
| Switching `--bg`/`--accent` recolors without re-render | Manual: `/dev/preview`, edit CSS var in DevTools | All surfaces update; no React re-render visible. |
| All 8 font pairs render PT + EN copy | Manual: `/dev/preview`, switch through each pair | "São Paulo, ção, açaí, mãe" + "The quick brown fox" both render correctly. |
| ≤ 50KB per pair after subsetting | `pnpm build` then `du -sh .next/static/media/*.woff2` | Each pair total ≤ 50KB. |
| `prefers-reduced-motion` disables stagger | DevTools "Emulate prefers-reduced-motion: reduce" + `/dev/preview` | Reveal animation becomes instant; grain hidden. |
| `pnpm contrast:check` passes WCAG AA | `pnpm contrast:check` | Exit 0, prints "✓ 72/72 preset combos pass AA". |
| Standard quality gates | `pnpm typecheck && pnpm lint && pnpm build` | All green. |

## Test plan (TDD)

- **Unit (Vitest + RTL):** each primitive — Button variants, Card composition, Anchor states, Tag rendering, IconButton accessible label.
- **Logic (Vitest):** `contrast-check.ts` exposes a pure `passesAA(bg, fg, threshold)` — test with known WCAG fixtures.
- **No E2E in this task** — Playwright is task-04. We don't add a Playwright dep here.
- **Visual regression deferred** — task-04 wires Lighthouse + visual diffs. This task only commits primitives whose unit tests pass.

## Out of scope (explicit)

- Per-profile theme overrides at runtime — task-18 (editor) writes the choice; task-19 (public profile) injects the chosen theme's CSS vars.
- Custom CSS escape hatch — v2 (PRD §12.2 "What is NOT customizable").
- Storybook — `_internal/preview` is the substitute. Reconsider in v2 if we add a designer.
- Playwright + axe automation — task-04.
- Locale-aware copy in the preview — preview uses hardcoded PT/EN samples; locale routing is task-29.

## Risks

- **R1 — Font pair byte budget.** Fraunces and Big Shoulders Display ship lots of glyph variants; subsetting may not get under 50KB if we include both italic + variable axes. *Mitigation:* if any pair busts budget, subset to just `latin + latin-ext` regular + 700 weights; document the trade-off.
- **R2 — OKLCH browser support.** Safari < 15.4 lacks OKLCH. *Mitigation:* PostCSS `@csstools/postcss-oklab-function` polyfill emits sRGB fallback at build time.
- **R3 — `eslint-plugin-tailwindcss` and Tailwind 3.4.** Plugin sometimes lags Tailwind point releases. *Mitigation:* pin to a known-good version; if it errors on `theme.extend`, drop it and rely on `prettier-plugin-tailwindcss` for ordering only.
- **R4 — PT-BR diacritic coverage.** Not every Google Font ships full Latin-Extended at every weight. *Mitigation:* the manual font validation step (sequence #2) catches gaps; swap any failing pair before locking the list.

## Done when

1. All AC rows above are green.
2. `docs/design-system.md` committed.
3. Plan file (this doc) committed alongside the scaffold.
4. Brain updated with the chosen color space (OKLCH) and grain mechanism so downstream tasks don't re-litigate them.
