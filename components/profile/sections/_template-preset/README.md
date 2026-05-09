# `_template-preset/` — starting point for a new preset

This folder is the canonical scaffold for adding a new design preset to
the registry. Copy the folder, rename it after your preset id, fill in
the design, register the preset in
[`lib/presets/index.ts`](../../../../lib/presets/index.ts), and the
renderer will pick it up automatically.

## Single dispatch shape: folder-owned

Every preset in the registry is **folder-owned**: it ships its own
nine-section suite under `components/profile/sections/<preset.id>/` and
the root dispatchers (e.g. [`AboutRender.tsx`](../AboutRender.tsx))
route on `preset.id`. There is no library-variant pool — if two presets
want the same visual, each owns a copy. See
[`lib/presets/types.ts`](../../../../lib/presets/types.ts) for the
schema.

## File layout

A preset folder contains exactly nine files:

```
components/profile/sections/<preset.id>/
├── HeroRender.<preset.id>.tsx
├── AboutRender.<preset.id>.tsx
├── ServicesRender.<preset.id>.tsx
├── PhotoGalleryRender.<preset.id>.tsx
├── FeaturedTrackRender.<preset.id>.tsx
├── InstagramFeedRender.<preset.id>.tsx
├── SocialLinksRender.<preset.id>.tsx
├── PressKitLinkRender.<preset.id>.tsx
└── ContactRender.<preset.id>.tsx
```

Filenames mirror the root dispatcher names in `sections/` exactly. The
suffix between the dot and `.tsx` is the preset id (lowercase,
dash-cased).

## Naming convention for the exported component

Each file exports one component. The export name is `<Section><PresetSlug>`
in PascalCase. For `electric-fire-techno`, `<PresetSlug>` is
`ElectricFireTechno`:

| File                                 | Export name                       |
| ------------------------------------ | --------------------------------- |
| `HeroRender.<id>.tsx`                | `Hero<PresetSlug>`                |
| `AboutRender.<id>.tsx`               | `About<PresetSlug>`               |
| `ServicesRender.<id>.tsx`            | `Services<PresetSlug>`            |
| `PhotoGalleryRender.<id>.tsx`        | `PhotoGallery<PresetSlug>`        |
| `FeaturedTrackRender.<id>.tsx`       | `FeaturedTrack<PresetSlug>`       |
| `InstagramFeedRender.<id>.tsx`       | `Instagram<PresetSlug>` *or* `InstagramFeed<PresetSlug>` |
| `SocialLinksRender.<id>.tsx`         | `SocialLinks<PresetSlug>`         |
| `PressKitLinkRender.<id>.tsx`        | `PressKitLink<PresetSlug>`        |
| `ContactRender.<id>.tsx`             | `Contact<PresetSlug>`             |

`Instagram*` vs. `InstagramFeed*` is the only spot where existing
presets diverge — both forms are used in the registered presets. Pick
whichever reads cleaner; the dispatcher only cares about the file path.

## Adding a new preset (checklist)

1. **Copy the folder.** `cp -r _template-preset <preset.id>`.
2. **Rename the files.** `<Section>Render.template-preset.tsx` →
   `<Section>Render.<preset.id>.tsx` for all nine files.
3. **Rename the exports.** `<Section>_TEMPLATE_PRESET` →
   `<Section><PresetSlug>` in each file.
4. **Fill in the design.** Each stub starts from a clean Tailwind
   layout with the same content contracts as the root dispatcher's
   no-preset fallback. Replace the placeholder visuals; keep the data
   extraction logic.
5. **Register the preset.** Create `lib/presets/<preset.id>.ts` (model
   on `electric-fire-techno.ts`), set `ownedSections: true`, then
   import it into
   [`lib/presets/index.ts`](../../../../lib/presets/index.ts) and add
   it to the `PRESETS` array.
6. **Wire the dispatchers.** Add a `preset?.id === '<preset.id>'`
   branch to each of the nine root dispatchers
   ([`AboutRender.tsx`](../AboutRender.tsx),
   [`HeroRender.tsx`](../HeroRender.tsx), …) that imports your new
   component.
7. **Decorations.** Any preset-only chrome (scanlines, gradients, glow)
   that the section components reference via `data-*` attributes needs
   the matching CSS in
   [`app/globals.css`](../../../../app/globals.css) scoped under a
   `[data-preset-<id>]` selector wired through `Preset.decorations` and
   `ProfileRenderer`.
8. **Thumbnail.** Add `/public/presets/<preset.id>/thumb.{jpg,png,webp}`
   (4:3, ~50 KB) and reference it from the preset's `thumbnail` field.
9. **i18n.** Add `presets.<preset.id>.{name,tagline}` to the locale
   files; the registry's `name` / `tagline` are PT-BR fallbacks.

## What lives in this folder vs. the parent

- **Folder-local stubs:** anything visually owned by this preset.
- **Parent (`sections/`) shared helpers:** `LazyEmbed`, `LazyIframe`,
  `PlatformIcon`, `TrackedSocialLink`, `TrackedContactCta`,
  `TrackedPressKitAnchor`, `ContactForm`, `GalleryLightbox`. Always
  import these from `..`, never duplicate them.

## Reference implementations

All four bundled presets follow this convention. See:

- [`../electric-fire-techno/`](../electric-fire-techno/) — opinionated
  techno-rave suite with bespoke CSS chrome (scanlines, fire edges,
  cyan glow).
- [`../mediakit-pro-v1/`](../mediakit-pro-v1/) — brutalist editorial
  suite (the registry's default for new profiles).
- [`../festival-club-orange/`](../festival-club-orange/) — light cream
  + electric orange festival aesthetic.
- [`../editorial-nightlife-v1/`](../editorial-nightlife-v1/) — the
  baseline classic look that legacy profiles get backfilled to.
