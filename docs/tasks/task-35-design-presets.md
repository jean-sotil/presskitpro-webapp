# Task 35 — Design Presets (Editor Tab + Preset Registry)

## Summary
Add a **Design** tab to the profile editor that lets the artist switch the entire visual treatment of their public DJ landing page by picking a named *preset*. A preset bundles the existing theme tokens (colors, fonts, layout) **plus** per-section visual variants (hero treatment, social row style, press-kit panel style, contact panel, marquee/ticker decorations). Ship the framework + one fully-rendered preset (MediakitPRO Template 1) as the POC and as the new default for fresh profiles.

## PRD references
- §6 (Public profile sections), §10 (Theme/branding), §16 (Pricing — premium presets are a v2 monetization lever, but every preset is free for v1).
- New: §6.6 — design presets (to be appended to the PRD when this lands).

## Dependencies
- task-09 (editor shell + tabs), task-10 (hero render variants), task-12 (gallery layout), task-18 (theme tab + contrast gate), task-19 (public profile route), task-29 (i18n — preset names live in the catalogs).

## Scope (in)

### POC scope (this task)
- New `presets/` registry module: each preset is a typed object with `id`, `name`, theme tokens, section-variant choices, decoration toggles, and a thumbnail path.
- `Themes.presetId` field (Payload) — null = legacy editorial-nightlife defaults, set = pick from registry.
- New **Design** tab in the profile editor adjacent to **Theme**: card grid of presets with a thumbnail, name, and tagline; click to apply (writes `presetId` + propagates the preset's theme tokens to existing `Themes` fields).
- `ProfileRenderer` resolves `presetId` → preset → passes per-section `variant` strings down to existing section render components.
- One fully-rendered preset: `mediakit-pro-v1`, modeled on [docs/presets/MediakitPRO™_Template - 1.jpg](../presets/MediakitPRO™_Template%20-%201.jpg). Variants ship for hero, social-links, press-kit, contact, and a new marquee decoration.
- `mediakit-pro-v1` becomes the **default preset** for new profiles created via onboarding.
- Preset thumbnails live at `public/presets/<id>/thumb.jpg`.
- The existing default look ("Editorial Nightlife") gets shipped as a sibling preset `editorial-nightlife-v1` so existing artists keep their current style; the data migration is a one-line UPDATE documented in the runbook.

### Out (deferred to follow-up tasks)
- Remaining presets beyond `mediakit-pro-v1` and `editorial-nightlife-v1`.
- Per-preset custom CSS (the v1 system is variant-by-name only).
- A/B-style preset previews against the visitor's actual content.
- Preset marketplace / paid / community presets.
- Animated preview cards in the Design tab (static thumbnails only).
- Custom preset creation by end users (admin-only via Payload Admin in v1).

## Acceptance criteria
- [ ] A fresh profile created via onboarding renders with the `mediakit-pro-v1` preset out of the box on `/[slug]`.
- [ ] An artist can open the editor's Design tab, see at least 2 presets (MediakitPRO + Editorial Nightlife), pick one, and the public profile re-renders with the new look on the next request.
- [ ] Switching presets writes `Themes.presetId` AND propagates the preset's color/font tokens into the existing `Themes` fields so the contrast gate (task-18) keeps gating publish.
- [ ] All 6 reference-image sections (hero, marquee, bio, social-links, press-kit, gallery, contact) render with the MediakitPRO variant when the preset is active.
- [ ] Existing artists on the legacy default see the visually-identical `editorial-nightlife-v1` preset selected after a one-time SQL backfill.
- [ ] The MediakitPRO preset rendered on `/<slug>` matches the reference image's structural intent: black-dominant background, marquee/ticker artist-name decoration, icon-list social section, square graphic panel for press-kit, WhatsApp-prominent contact.
- [ ] Lighthouse Performance ≥ 95 on the MediakitPRO preset (the budget from task-26 is non-negotiable; new SVG/decoration assets must be inlined or lightweight).

## Implementation notes

- **Why a preset registry, not Payload-stored presets?** A preset is a code-level design contract — it ships variants that the renderer must implement. Storing presets in Payload would let admins create them but break the type guarantee. Code-defined registry keeps the variant strings type-safe and the rendered output reviewable in PR diffs.
- **Why two presets at launch (MediakitPRO + Editorial Nightlife)?** Two presets prove the framework works — switching between them is the only way to demonstrate that section variants are wired correctly. Shipping with one preset would tie the framework's correctness to the migration of existing artists.
- **Why marquee/ticker as a decoration, not a section?** Decorations are non-content adornments (dividers, ticker bands, frames) that don't need editor configuration — they're owned by the preset, not the artist. The artist's *content* is the same across presets; the *chrome* is what changes.

## Definition of Done
Per Appendix C.
