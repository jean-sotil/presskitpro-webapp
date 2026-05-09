import type { Preset } from './types';

/**
 * Electric Fire Techno — modeled on
 * docs/presets/MediakitPRO_template_3.json. Near-black canvas with a
 * blue undertone, fire-orange display gradient, Bebas Neue display
 * ladder. Designed for techno / industrial-techno / hard-bass /
 * power-noise artists.
 *
 * Visual signature (within the registry's variant vocabulary):
 *   - Split hero: portrait left, two-line title right.
 *   - Centered bio.
 *   - 3-up uniform gallery grid.
 *   - Icon-list socials.
 *   - Cursor-CTA press kit (the spec's "retro hand cursor SVG" lands
 *     directly on `cursor-cta`'s built-in cursor element).
 *   - Dark-panel contact footer.
 *
 * Token notes:
 *   - `bgPresetId: 'blueprint'` is the closest curated dark-with-blue
 *     bg; `bg` is overridden to `#09090F` to match the spec exactly.
 *   - `accentPresetId: 'burnt-orange'` is the closest curated fire
 *     hue; `accent` is overridden to `#FF4500` so the display gradient
 *     and CTA glow read as "fire" instead of "burnt clay".
 *   - `fontPairId: 'retro-future'` ships Bebas Neue + Space Mono — a
 *     direct match for the spec's display face. Body face in the spec
 *     was Rajdhani; Space Mono is the closest sci-fi sibling already
 *     loaded by `lib/design/fonts.ts`.
 *
 * Effects punted to a follow-up (would each need a new decoration
 * type or variant component to render): chromatic aberration on the
 * portrait, fire-particle edges, lightning-bolt SVGs, scanline
 * overlay, neon-pulse on the press kit CTA, circuit-board background
 * texture, corner metadata strings. The `filmGrain` decoration is
 * enabled as the closest existing match to the spec's grain layer.
 */
export const electricFireTechno: Preset = {
  id: 'electric-fire-techno',
  name: 'Electric Fire Techno',
  tagline:
    'Estética rave infernal: preto azulado, fogo elétrico, lightning cyan e tipografia condensada em alto contraste.',
  theme: {
    bgPresetId: 'blueprint',
    accentPresetId: 'burnt-orange',
    bg: '#09090F',
    accent: '#FF4500',
    text: '#FFFFFF',
    fontPairId: 'retro-future',
  },
  sections: {
    hero: 'fire-techno',
    bio: 'fire-frame',
    services: 'fire-cards',
    gallery: 'glow-grid',
    featuredTrack: 'glow-track',
    instagram: 'glow-feed',
    socialLinks: 'glow-buttons',
    pressKit: 'fire-cta',
    contact: 'fire-footer',
  },
  decorations: {
    marquee: { source: 'displayName' },
    filmGrain: true,
    electricFire: true,
    circuitBoard: true,
  },
  thumbnail: '/presets/electric-fire-techno/thumb.png',
};
