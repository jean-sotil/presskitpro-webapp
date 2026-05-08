import type { FontPairId } from '@/lib/design/tokens';

/**
 * A design preset bundles theme tokens with section-variant choices and
 * preset-owned decorations (chrome the artist doesn't configure). The
 * renderer resolves a profile's `Themes.presetId` to one of these and
 * dispatches each section's render to the matching variant.
 *
 * Per task-35 plan: code-defined registry (not Payload-stored) so the
 * variant strings are type-safe and rendered output is reviewable in
 * PR diffs. Adding a new variant string forces the renderer's switch
 * to handle it — TypeScript fails the build if it doesn't.
 */

export type HeroVariant =
  | 'full-bleed-portrait'
  | 'split-portrait-text'
  | 'centered-logo'
  | 'title-overlay-broken'
  | 'cutout-layered';

export type BioVariant = 'classic' | 'split-image-text';

export type GalleryVariant =
  | 'mosaic'
  | 'uniform-grid'
  | 'carousel'
  | 'editorial-grid'
  | 'film-strip';

export type ServicesVariant = 'classic' | 'rail-cards' | 'orange-cards';

export type SocialVariant = 'pill-list' | 'icon-list' | 'platform-stats';

export type PressKitVariant = 'inline-cta' | 'square-panel' | 'cursor-cta';

export type ContactVariant =
  | 'inline-cta'
  | 'dark-panel'
  | 'two-column-footer';

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

export type PresetSections = {
  hero: HeroVariant;
  bio: BioVariant;
  services: ServicesVariant;
  gallery: GalleryVariant;
  socialLinks: SocialVariant;
  pressKit: PressKitVariant;
  contact: ContactVariant;
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
 */
export type PresetDecorations = {
  marquee?: { source: 'displayName' | 'tagline' };
  filmGrain?: boolean;
};

export type Preset = {
  id: string;
  /** PT-BR display label; doubles as the Payload admin select label
   *  and the i18n fallback when `presets.<id>.name` is missing. */
  name: string;
  /** PT-BR tagline; same fallback posture as `name`. */
  tagline: string;
  theme: PresetTheme;
  sections: PresetSections;
  decorations?: PresetDecorations;
  /** Public path to a static thumbnail (4:3, ~50 KB). */
  thumbnail: string;
};
