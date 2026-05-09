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
  | 'cutout-layered'
  | 'fire-techno';

export type BioVariant = 'classic' | 'split-image-text' | 'fire-frame';

export type GalleryVariant =
  | 'mosaic'
  | 'uniform-grid'
  | 'carousel'
  | 'editorial-grid'
  | 'film-strip'
  | 'glow-grid';

export type ServicesVariant =
  | 'classic'
  | 'rail-cards'
  | 'orange-cards'
  | 'fire-cards';

export type InstagramVariant = 'classic' | 'glow-feed';

export type FeaturedTrackVariant = 'classic' | 'glow-track';

export type SocialVariant =
  | 'pill-list'
  | 'icon-list'
  | 'platform-stats'
  | 'glow-buttons';

export type PressKitVariant =
  | 'inline-cta'
  | 'square-panel'
  | 'cursor-cta'
  | 'fire-cta';

export type ContactVariant =
  | 'inline-cta'
  | 'dark-panel'
  | 'two-column-footer'
  | 'fire-footer';

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
  featuredTrack: FeaturedTrackVariant;
  instagram: InstagramVariant;
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
  sections: PresetSections;
  decorations?: PresetDecorations;
  /** Public path to a static thumbnail (4:3, ~50 KB). */
  thumbnail: string;
};
