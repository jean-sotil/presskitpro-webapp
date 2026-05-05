# PressKit Pro — Design System

> Implementation of [PRD §12](presskit-pro-prd.md#12-visual-design-direction--theming-system).
> Source of truth for tokens: [`lib/design/tokens.ts`](../lib/design/tokens.ts).
> CSS vars: [`app/globals.css`](../app/globals.css).
> Live showcase (dev only): `/dev/preview`.

## Principles

- **Editorial, not generic.** Sharp edges (`--radius: 0`), poster-weight display type, generous negative space, single laser accent.
- **Token-driven.** Color and font-family are the only axes that vary per profile. Spacing, type scale, line heights, motion timings are locked.
- **Accessibility-first.** Every preset combo passes WCAG 2.2 AA — verified by `bun run contrast:check`. `prefers-reduced-motion` disables grain + reveal animations.
- **OKLCH everywhere.** Color values are stored as OKLCH triplets (perceptual lightness) and emitted as `oklch()` in CSS. PostCSS plugin emits sRGB fallback for Safari < 15.4.

## Tokens

### Colors

CSS vars on `:root` (see [`app/globals.css`](../app/globals.css)). Triplets are stored without the wrapping `oklch()` so Tailwind composes alpha modifiers (`bg-accent/50`).

| Var | Default value | Role |
|---|---|---|
| `--bg` | `0.094 0 0` (`#030303`) | Page background |
| `--surface` | `0.155 0 0` (`#141414`) | Cards, embeds |
| `--border` | `0.218 0 0` (`#1f1f1f`) | Hairlines |
| `--text` | `0.938 0.009 88` (`#edeae4`) | Body copy |
| `--text-muted` | `0.620 0.010 78` (`#898581`) | Secondary copy |
| `--accent` | `0.550 0.190 142` (`#018a00`) | CTAs, hover, focus, links |
| `--accent-contrast` | `0.094 0 0` | Text-on-accent |

### Bg presets (6)

`editorial-night` (default), `raw-concrete`, `blueprint`, `paper-white`, `bone`, `cream`. Three dark + three light. Auto-derived `--text` flips by mode.

### Accent presets (12)

All tuned to OKLCH L ≈ 0.50 so every accent passes WCAG AA 3:1 against every bg:

`electric-green`, `hot-pink`, `signal-red`, `amber`, `cobalt`, `ultraviolet`, `crimson`, `forest`, `plum`, `magenta`, `ink-blue`, `burnt-orange`.

> The L=0.50 constraint trades raw vibrancy for universal contrast. If task-18 (theme tab) wants louder accents on a specific bg, add a per-bg accent set instead of widening the global accent palette.

### Typography

8 font pairs from PRD §12.2, loaded via `next/font/google` with `latin + latin-ext` subsets so PT-BR diacritics render. Each pair sets three CSS vars:

| Var | Role |
|---|---|
| `--font-display` | Posters, hero headings, section markers |
| `--font-body` | Body copy, navigation, forms |
| `--font-editorial` | One italic moment (tagline). Defaults to body if the pair has no editorial face. |

Pairs:

| Id | Display | Body | Editorial |
|---|---|---|---|
| `editorial-nightlife` (default) | Anton | Manrope | Fraunces (italic) |
| `magazine` | Fraunces | Manrope | Fraunces |
| `brutalist` | Archivo Black | JetBrains Mono | — |
| `refined` | Cormorant Garamond | Inter Tight | Cormorant |
| `industrial` | Big Shoulders | Sora | — |
| `soft-pop` | Outfit | DM Sans | — |
| `retro-future` | Bebas Neue | Space Mono | — |
| `classic-press` | Playfair Display | Source Sans 3 | Playfair |

> "Big Shoulders Display" is now the optical-size axis of the consolidated `Big_Shoulders` family on Google Fonts; we use the variable file.

### Locked rules (NOT user-customizable)

| Token | Value | Why locked |
|---|---|---|
| `--radius` | `0` | Editorial sharpness; rounding it kills the design language. |
| Spacing scale | Tailwind's 4-px grid | Mathematical rhythm; 8-point grid per frontend-design protocol. |
| Type scale | Tailwind defaults | Prevents per-profile typographic chaos. |
| Motion timings | `--motion-quick: 140ms`, `--motion-base: 240ms`, `--motion-slow: 420ms`, stagger `40ms` | One coherent motion vocabulary across the app. |

## Components

All in [`components/`](../components). Hand-built — no shadcn — to honor `--radius: 0` and the editorial aesthetic.

### `components/ui/` (primitives)

| Component | Variants / sizes | Notes |
|---|---|---|
| `Button` | `primary`, `ghost`, `link` × `sm`, `md`, `lg` | Display font, uppercase, sharp. `active:scale-[0.97]` press effect; disabled via `prefers-reduced-motion`. |
| `Card` | — | `--surface` bg, `--border` hairline, no shadow. |
| `Section` | — | Semantic `<section>` with vertical rhythm + max-width. |
| `Anchor` | `external?` flag | Auto-applies `target="_blank"` + `rel="noopener noreferrer"` for external links. |
| `Tag` | — | Uppercase pill, no rounding, accent-aware border. |
| `IconButton` | — | 44×44 (Fitts's Law). Requires accessible `label`; clones the icon child with `aria-hidden="true"`. |

### `components/atmosphere/`

| Component | Notes |
|---|---|
| `Grain` | Fixed-position PNG noise overlay (`public/grain.png`, ~34 KB). `mix-blend-mode: overlay`, opacity `--grain-opacity` (0.04 default). Hidden under reduced motion. |
| `SectionMarker` | `01 — SOBRE` ornament. Decorative; hidden from assistive tech. |
| `RevealStagger` | Wraps children with `data-reveal` + `--reveal-index`. Animation lives in CSS via native `animation-timeline: view()` — no JS observer. |

## Verification commands

| Command | What it does |
|---|---|
| `bun run test` | Vitest unit suite for primitives + contrast helper. |
| `bun run contrast:check` | WCAG AA matrix over 6 bg × (12 accent + auto-text) = 78 combos. Fails CI on any miss. |
| `bun run typecheck` | `tsc --noEmit`. |
| `bun run lint` | ESLint + Tailwind plugin. |
| `bun run dev` then `/dev/preview` | Live theme switcher. Validates each font pair renders PT-BR diacritics + all primitives + atmosphere. 404s in production. |
| `bun run generate:grain` | Regenerate `public/grain.png` (idempotent random noise). Re-run only if the noise look needs refreshing. |

## Adding a new preset

1. Edit `lib/design/tokens.ts` — add the entry with an OKLCH triplet.
2. `bun run scripts/sync-hex.ts` to print the canonical hex; paste it into the entry's `hex` field.
3. `bun run contrast:check` — must stay green (78/78).
4. `bun run dev` and visit `/dev/preview` to eyeball it under each font pair.
5. Document the new preset in this file.

## Reduced-motion behavior

Defined in [`app/globals.css`](../app/globals.css):

- All animations and transitions collapse to `0.01ms` so they're effectively instant but `transitionend` events still fire (don't break logic depending on them).
- `[data-grain]` is `display: none` — no film-grain texture.
- `data-reveal` elements still render; the scroll-driven keyframe just resolves to its end state immediately.

Test in DevTools: emulate `prefers-reduced-motion: reduce` and confirm the preview page has no grain and shows content statically.

## Out of scope (downstream tasks)

- **Per-profile theme runtime** — task-18 wires the editor "Theme" tab; task-19 injects the chosen profile's CSS vars on the public page.
- **Custom CSS escape hatch** — v2 only.
- **Visual regression testing** — task-04 wires Playwright + Lighthouse.
- **Storybook** — `/dev/preview` is the substitute. Reconsider only if a designer joins.
