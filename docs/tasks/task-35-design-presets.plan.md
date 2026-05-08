# Task 35 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-35-design-presets.md](./task-35-design-presets.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Today every published profile renders with a fixed visual treatment — the "Editorial Nightlife" tokens from task-03 + the section-style choices in `Themes.heroStyle` / `Themes.galleryLayout`. There is no way for an artist to swap to a fundamentally different aesthetic without engineering work. Task-35 turns the renderer into a **preset-driven** system: each named preset bundles theme tokens with per-section variant choices, the editor exposes a "Design" tab that picks a preset, and adding a new preset is a code-level activity that doesn't touch the renderers themselves.

The POC ships [MediakitPRO Template 1](../presets/MediakitPRO%E2%84%A2_Template%20-%201.jpg) — a brutalist, black-dominant nightlife aesthetic — as the new default for fresh profiles. The existing default look becomes a peer preset (`editorial-nightlife-v1`) so the framework demonstrably handles two distinct visual systems on the same content.

## Reference design analysis (MediakitPRO Template 1)

Single-column, mobile-first, black-dominant. Seven distinct visual blocks stacked vertically:

| Block | Content | Visual treatment |
|---|---|---|
| 1. Hero | DJ portrait + artist name | Tile-broken portrait, oversized dj name overlapping image, white text on black |
| 2. Marquee | Artist name (decoration) | Repeating ticker band ("dj username …") with cut-out treatment |
| 3. Bio | Photo + body text | 2-column split: cyan/red color-overlaid live photo on left, "BIOGRAPHY" heading + body on right |
| 4. Social | IG / YouTube / SoundCloud / More links + CTA | Black panel, icon-list rows, single dark-bordered "CLICK HERE" button |
| 5. Press kit | Square panel + CTA | Square graphic (record/glitch motif) with "DOWNLOAD PRESSKIT" + button |
| 6. Gallery | 2 portrait photos | Inline horizontal arrangement |
| 7. Contact | "FOR BOOKING CONTACT" + WhatsApp icon + email + CTA | Dark panel, WhatsApp emphasis, white-on-black |

Visual tokens: pure black backgrounds, white/off-white text, accent color cyan-red on photo overlays, bold display-sans titles in mixed case, body sans at small sizes, heavy negative space, no rounded corners, no shadows. Sentence case prevails inside copy; titles tend toward all-caps for hierarchical emphasis.

These don't need 7 new components — they're variants of the existing 6 section components plus one new decoration (marquee).

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Preset shape | Pure TS module: `lib/presets/<id>.ts` exports a `Preset` object with `{ id, name, tagline, defaultPreset?, theme: { bg, accent, text, contrast, fontPairId }, sections: { hero, gallery, socialLinks, pressKit, contact }, decorations: { marquee?: { text } }, thumbnail }`. Registry at `lib/presets/index.ts` collects all presets into `PRESETS: readonly Preset[]`. | Type-safe, reviewable in diffs, no Payload schema cost. The variant strings are unioned types so the renderer + editor share one source of truth. |
| 2 | Themes.presetId field | New select on `Themes`: options = preset ids + `null` (legacy). Default `null` for existing rows; `mediakit-pro-v1` for new rows via the onboarding action. | Keeps the existing `Themes` columns load-bearing for the contrast gate (task-18) — the preset just *populates* them on first apply. |
| 3 | Variant resolution | `ProfileRenderer` reads `Themes.presetId` → looks up the preset → passes variant strings as props to existing section render components (`<HeroRender variant="title-overlay-broken" …/>`). Each component switch-statements over its own variant union. | No changes to which sections render — only HOW each one renders. Existing variant fields (`heroStyle`, `galleryLayout`) become fallbacks when `presetId` is null. |
| 4 | Apply-preset flow | Editor's Design tab calls a server action `applyPresetAction(presetId)` that:<br>(a) writes `Themes.presetId`,<br>(b) overwrites the theme color/font fields with the preset's tokens (so the contrast gate runs against the new palette),<br>(c) bumps `Themes.contrastValidatedAt = null` so re-publish requires a fresh contrast pass. | The contrast gate (task-18 `CONTRAST_STALE_AFTER_MS`) protects accessibility through preset switches. |
| 5 | Decorations | Preset-owned, code-rendered, no editor knobs. v1 adds one decoration: `marquee.text`. The renderer reads `decorations.marquee` from the active preset and renders an `<aside data-marquee>` band between hero and bio. | Decorations are chrome, not content — owning them in the preset is correct. |
| 6 | Default for new profiles | Onboarding action sets `Themes.presetId = 'mediakit-pro-v1'` on profile creation. | Spec — the POC IS the new default. |
| 7 | Migration for existing profiles | One SQL UPDATE (documented in the runbook) sets `Themes.preset_id = 'editorial-nightlife-v1'` for every existing row. The legacy preset is visually identical to today's render, so the upgrade is invisible. | Avoids a migration script; the SQL is one-shot per env. |
| 8 | Thumbnail strategy | Static JPG at `public/presets/<id>/thumb.jpg`, 4:3 aspect, ~50 KB max. The Design tab renders them with `next/image`. The MediakitPRO thumbnail can be a cropped version of the reference template image; Editorial Nightlife uses a screenshot of the current rendered look. | Static assets keep the editor bundle from ballooning; thumbnails don't need to be live-rendered. |
| 9 | i18n | Preset `name` and `tagline` live in `messages/{pt,en,es}.json` under `presets.<id>.name` / `presets.<id>.tagline`. | Same posture as the rest of the chrome. |
| 10 | Out of scope (PR-A) | Remaining presets beyond the two; per-preset custom CSS; live preview on hover; user-created presets. | Each is a separate, low-risk follow-up. |

## File inventory

### New
- `lib/presets/types.ts` — `Preset` type + variant unions (`HeroVariant`, `GalleryVariant`, `SocialVariant`, `PressKitVariant`, `ContactVariant`).
- `lib/presets/mediakit-pro-v1.ts` — the POC preset definition.
- `lib/presets/editorial-nightlife-v1.ts` — sibling preset matching the current default.
- `lib/presets/index.ts` — `PRESETS: readonly Preset[]`, `getPresetById`, `getDefaultPreset`.
- `lib/presets/index.test.ts` — registry shape + default lookup tests.
- `lib/presets/apply-preset.ts` (+ test) — pure helper that takes a preset and an existing Themes doc, returns the patch.
- `app/dashboard/profile/[id]/DesignTab.tsx` — client component, card grid, preset-apply trigger.
- `app/dashboard/profile/[id]/design-actions.ts` — `'use server'` `applyPresetAction(profileId, presetId)`.
- `components/profile/sections/decorations/Marquee.tsx` — small decoration component for the ticker band.
- `components/profile/sections/HeroRender.title-overlay-broken.tsx` — new hero variant for MediakitPRO.
- `components/profile/sections/SocialLinksRender.icon-list.tsx` — new social variant.
- `components/profile/sections/PressKitLinkRender.square-panel.tsx` — new press-kit variant.
- `components/profile/sections/ContactRender.dark-panel.tsx` — new contact variant.
- `public/presets/mediakit-pro-v1/thumb.jpg` — 4:3 thumbnail.
- `public/presets/editorial-nightlife-v1/thumb.jpg` — 4:3 thumbnail.

### Modified
- `payload/collections/Themes.ts` — `presetId` select (options derived from `PRESETS`).
- `payload-types.ts` — regenerated.
- `components/profile/ProfileRenderer.tsx` — resolves `presetId`, passes variant props.
- `components/profile/sections/HeroRender.tsx` — switches on `variant` prop and delegates to either the existing `full-bleed-portrait` / `split-portrait-text` / `centered-logo` blocks OR the new `title-overlay-broken` variant component.
- `components/profile/sections/{SocialLinksRender,PressKitLinkRender,ContactRender,PhotoGalleryRender}.tsx` — same variant-switch pattern.
- `app/dashboard/profile/[id]/EditorClient.tsx` — registers the new "Design" tab between "Theme" and the existing tabs.
- `app/onboarding/actions.ts` — sets `Themes.presetId = 'mediakit-pro-v1'` on profile creation.
- `messages/{pt,en,es}.json` — `presets.<id>.{name,tagline}` and Design-tab chrome strings.
- `docs/runbooks/dev-editor.md` — one-line backfill SQL + how to add a new preset.

### Untouched (verified)
- The contrast-validation flow from task-18 — `applyPresetAction` writes new color tokens and nulls `contrastValidatedAt`, forcing a fresh contrast pass before publish.
- The slug + analytics + middleware paths — design is purely render-layer.
- The bundle-budget gate (task-26) — adding presets adds bytes; the budget caps the regression.

## Implementation sequence

1. **Plan doc** (this).
2. **`lib/presets/types.ts` + `lib/presets/index.ts` + `apply-preset.ts` (TDD on the apply helper).**
3. **`Themes.presetId` schema + regen types.**
4. **`editorial-nightlife-v1` preset definition + sibling thumbnail (screenshot of current default).**
5. **`mediakit-pro-v1` preset definition + thumbnail crop from the reference image.**
6. **Variant components — incremental:** title-overlay-broken hero, icon-list social, square-panel press-kit, dark-panel contact, marquee decoration.
7. **`ProfileRenderer` variant wiring.**
8. **Existing section components grow `variant` switch + delegate to existing JSX as the fallback path.**
9. **Editor Design tab + `applyPresetAction` server action.**
10. **Onboarding default flip to `mediakit-pro-v1`.**
11. **i18n keys (3 locales × ~10 strings).**
12. **Runbook backfill SQL note.**
13. **Verification (typecheck + tests + i18n:check + build + e2e + bundle:check).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Fresh profile renders MediakitPRO out of the box | Onboarding test asserts `Themes.presetId === 'mediakit-pro-v1'` after profile creation; manual visit of `/<seeded-slug>` shows the brutalist look. |
| Artist can switch presets and the public re-renders | New e2e: open editor → click Design tab → click Editorial Nightlife card → reload `/[slug]` → assert the previous look. |
| Switching writes `presetId` + theme tokens + clears `contrastValidatedAt` | Unit test on `buildApplyPresetPatch` covers the patch shape. |
| 6 sections render with MediakitPRO variants when active | Component-level test for each new variant component + a snapshot-style check on the rendered DOM. |
| Existing artists keep their look after backfill | Runbook SQL is one-shot and idempotent; legacy preset's tokens match the current defaults. |
| MediakitPRO matches reference's structural intent | Manual side-by-side review against the reference JPG; documented in PR description. |
| Lighthouse Performance ≥ 95 on MediakitPRO | LHCI assertion config from task-26 is unchanged; new variants must use existing `next/image` patterns + inline SVG decorations only. |

## Test plan

- **Unit:** preset registry shape; `getPresetById` returns null on unknown; `buildApplyPresetPatch` produces expected theme-token + presetId + contrastValidatedAt patches; each variant component renders the expected DOM landmarks (h1/h2/role=main/aside) and accepts the expected props.
- **E2E (`@smoke`):** preset-switch — visit editor, click Design tab, switch to Editorial Nightlife, reload `/[slug]`, assert a structural marker that's unique to the legacy preset (e.g. the existing footer-ticker or the editorial color band).
- **Visual:** manual review against the reference JPG. Snapshot-based pixel checks are out of scope for v1 (too brittle to maintain).

## Risks

- **R1 — Marquee + glitched-photo treatments tank LCP.** The MediakitPRO hero overlays a tile-broken portrait + oversized title; if either renders client-side post-hydration, LCP misses the 2.5s budget. *Mitigation:* hero must be entirely server-rendered + use `next/image priority` on the LCP element; the tile-break treatment is a CSS `clip-path` mask on the existing portrait, not a separate raster.
- **R2 — Contrast gate failures after preset switch.** A preset's color tokens may not pass WCAG AA against the artist's content (e.g. a logo colored to fight the bg). *Mitigation:* `applyPresetAction` nulls `contrastValidatedAt`; the artist must run the contrast check before re-publishing. The Theme tab's existing contrast UI handles the case.
- **R3 — i18n drift.** Adding presets without adding their copy to all three locales would fail `i18n:check`. *Mitigation:* the registry references `presets.<id>.name`; CI fails on missing keys.
- **R4 — Migration of existing artists.** The legacy preset must be visually pixel-identical to today's render; otherwise an artist sees their site unexpectedly change. *Mitigation:* `editorial-nightlife-v1`'s tokens are copied verbatim from the current defaults in `lib/design/tokens.ts`; the variant choices (`hero=full-bleed-portrait`, `gallery=mosaic`, …) match the existing fields' defaults.
- **R5 — Adding a new preset later requires touching every section component.** *Mitigation:* the variant union types make this explicit at the type level — adding a new variant string to `HeroVariant` forces the renderer's switch to handle it, and TypeScript fails the build if it doesn't.

## Done when

1. `bun run test` includes new specs for the preset registry, the apply helper, and each new variant component — all green.
2. `bun run i18n:check` passes with the new `presets.*` keys × 3 locales.
3. `bun run typecheck` + `bun run build` + `bun run bundle:check` green; `/[slug]` First Load JS stays at or below the current 375 KB baseline ±10 KB tolerance.
4. New e2e (`tests/e2e/preset-switch.spec.ts`) green: editor → Design tab → switch → reload → assert the new look.
5. Manual: a fresh onboarding produces a profile that renders the MediakitPRO look at `/<slug>` without further action.
6. Plan doc (this) committed alongside the implementation.

## Out of scope (post-task-35)

- Additional presets beyond the two shipped (one new task per preset, or a batch task once the framework is exercised).
- Per-preset custom CSS / advanced typography overrides.
- Live preview cards in the Design tab (the artist's actual content rendered in each preset's chrome).
- Animated preview transitions between presets in the editor.
- User-created presets / agency-shared presets / paid presets (v2 monetization lever per PRD §16).
- Marketing copy explaining the preset system (lands when the public site adds a "Designs" page).
