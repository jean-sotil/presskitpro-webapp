import type { FontPairId } from '@/lib/design/tokens';

/**
 * A design preset bundles theme tokens with preset-owned decorations
 * (chrome the artist doesn't configure). The renderer resolves a
 * profile's `Themes.presetId` to one of these and dispatches each
 * section's render to the matching component.
 *
 * Section dispatch shape: every preset is folder-owned. Each preset
 * ships nine section components in
 * `components/profile/sections/<preset.id>/<Section>Render.<preset.id>.tsx`.
 * The root dispatchers (`AboutRender.tsx`, `HeroRender.tsx`, …) route
 * on `preset.id`. Adding a new preset means dropping a folder under
 * `sections/`, registering the preset config in `lib/presets/`, and
 * adding one branch to each of the nine root dispatchers.
 *
 * Scaffold a new preset from `components/profile/sections/_template-preset/`.
 *
 * The legacy library-variant shape (`Preset.sections` map +
 * `<Section>Render.<variant>.tsx` files at the top of `sections/`) was
 * removed when all four bundled presets migrated to folder-owned. The
 * variant-string types and the `sections` field are gone from this
 * schema — re-introduce them only if a future preset genuinely needs
 * to mix variants from a shared pool.
 */

export type PresetTheme = {
  /** `bgPresets[*].id` — populates `Themes.colorPresetId` on apply. */
  bgPresetId: string;
  /** `accentPresets[*].id` — populates `Themes.accentPresetId` on apply. */
  accentPresetId: string;
  /** Hex value mirrored into `Themes.bg`. */
  bg: string;
  /** Hex value mirrored into `Themes.accent`. */
  accent: string;
  /** Hex value mirrored into `Themes.text`; omit to auto-derive from bg. */
  text?: string;
  fontPairId: FontPairId;
};

/**
 * Decorations are preset-owned chrome — non-content adornments the
 * artist does not configure. v1 ships:
 *
 *   - `marquee` — accent-colored ticker band rendered between hero
 *     and the next section. `source` picks which profile field supplies
 *     the repeating text.
 *   - `filmGrain` — animated grain overlay scoped to the article via
 *     `[data-preset-grain]` (see app/globals.css). `true` opts in.
 *   - `electricFire` — bundled techno-rave effect stack (CRT scanlines,
 *     fire-edge gradients on the hero, gold→amber→fire gradient on
 *     display headings, neon-pulse box-shadow on the press kit CTA,
 *     cyan glow on gallery cards). Scoped to the article via
 *     `[data-preset-electric-fire]`. Pure CSS — GPU composited, zero
 *     JS, respects `prefers-reduced-motion`.
 *   - `circuitBoard` — faint cyan circuit-grid SVG repeating-tile
 *     applied as background-image on the article. Pairs with
 *     `electricFire` to give the page a "tech / motherboard" undertone
 *     without competing with content. Pure CSS via
 *     `[data-preset-circuit-board]`.
 */
export type PresetDecorations = {
  marquee?: { source: 'displayName' | 'tagline' };
  filmGrain?: boolean;
  electricFire?: boolean;
  circuitBoard?: boolean;
};

export type Preset = {
  id: string;
  /** PT-BR display label; doubles as the Payload admin select label
   *  and the i18n fallback when `presets.<id>.name` is missing. */
  name: string;
  /** PT-BR tagline; same fallback posture as `name`. */
  tagline: string;
  theme: PresetTheme;
  /**
   * Required marker confirming this preset's nine section components
   * live as a self-contained suite under
   * `components/profile/sections/<preset.id>/`. Always `true` for
   * registered presets — the field exists so future opt-out shapes
   * can be added without churning every preset config at once.
   */
  ownedSections: true;
  decorations?: PresetDecorations;
  /** Public path to a static thumbnail (4:3, ~50 KB). */
  thumbnail: string;
};
