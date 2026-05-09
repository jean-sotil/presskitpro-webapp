import type { Preset } from './types';

/**
 * Sibling preset matching the current default look (PRD §12.1). Existing
 * profiles get backfilled to this id by the one-shot SQL in
 * `docs/runbooks/dev-editor.md` so their rendered output is unchanged.
 *
 * Tokens are *snapshotted* from `lib/design/tokens.ts` `defaultTokens` —
 * intentionally hardcoded so future drift in the default-token constants
 * doesn't silently change every legacy profile's appearance (plan §R4).
 */
export const editorialNightlifeV1: Preset = {
  id: 'editorial-nightlife-v1',
  name: 'Editorial Nightlife',
  tagline: 'O visual original do PressKit Pro: editorial brutalista, alto contraste.',
  theme: {
    bgPresetId: 'editorial-night',
    accentPresetId: 'electric-green',
    bg: '#030303',
    accent: '#018a00',
    text: '#f0ede6',
    fontPairId: 'editorial-nightlife',
  },
  sections: {
    hero: 'full-bleed-portrait',
    bio: 'classic',
    services: 'classic',
    gallery: 'mosaic',
    featuredTrack: 'classic',
    instagram: 'classic',
    socialLinks: 'pill-list',
    pressKit: 'inline-cta',
    contact: 'inline-cta',
  },
  thumbnail: '/presets/editorial-nightlife-v1/thumb.jpg',
};
