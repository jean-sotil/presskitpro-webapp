import type { Preset } from './types';

/**
 * Hard Techno Underground — preset modeled on
 * docs/presets/MediakitPRO_template_1.json.
 *
 * Pure black + electric cobalt + white. Brutalist editorial with a
 * ghost-outlined hero title layered over a clip-path portrait, an
 * accent-colored scrolling marquee, ink-splatter SVG decorations, and
 * sharp-edge everything. Designed for techno / hard-techno / industrial
 * artists. The display name is "Hard Techno Underground" via i18n; the
 * registry id stays `mediakit-pro-v1` so the existing DB enum and
 * onboarding default keep working without another migration.
 */
export const mediakitProV1: Preset = {
  id: 'mediakit-pro-v1',
  name: 'Hard Techno Underground',
  tagline: 'Estética rave underground: preto puro, cobalt elétrico, título fantasma e marquee em alta voltagem.',
  theme: {
    bgPresetId: 'editorial-night',
    accentPresetId: 'cobalt',
    bg: '#000000',
    accent: '#1133FF',
    text: '#ffffff',
    fontPairId: 'retro-future',
  },
  ownedSections: true,
  decorations: {
    marquee: { source: 'displayName' },
    filmGrain: true,
  },
  thumbnail: '/presets/mediakit-pro-v1/thumb.jpg',
};
