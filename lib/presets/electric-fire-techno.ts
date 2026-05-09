import type { Preset } from './types';

/**
 * Electric Fire Techno — modeled on
 * docs/presets/MediakitPRO_template_3.json. Near-black canvas with a
 * blue undertone, fire-orange display gradient, Bebas Neue display
 * ladder. Designed for techno / industrial-techno / hard-bass /
 * power-noise artists.
 *
 * Section dispatch shape: `ownedSections: true`. The 9 section
 * components live as a self-contained suite under
 * `components/profile/sections/electric-fire-techno/<Section>Render.electric-fire-techno.tsx`.
 * The root dispatchers (e.g. `AboutRender.tsx`) route on `preset.id`
 * when the active preset is folder-owned. Adding a new section here
 * means dropping a 10th file into that folder and adding one branch
 * to the matching root dispatcher.
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
  ownedSections: true,
  decorations: {
    marquee: { source: 'displayName' },
    filmGrain: true,
    electricFire: true,
    circuitBoard: true,
  },
  thumbnail: '/presets/electric-fire-techno/thumb.png',
};
