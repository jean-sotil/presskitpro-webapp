import type { Preset } from './types';

/**
 * Nuclear Winter
 * Desolate, cold, and monochromatic. Bleached ash white, concrete gray,
 * and a single sky blue-white signal accent.
 */
export const nuclearWinter: Preset = {
  id: 'nuclear-winter',
  name: 'Nuclear Winter',
  tagline:
    'Estética desolada e gélida. Branco cinza pálido, tons de concreto e um único sinal azul-celeste frio.',
  theme: {
    bgPresetId: 'obsidian',
    accentPresetId: 'editorial-night',
    bg: '#050505',
    accent: '#e0eaff',
    text: '#d1d1d1',
    fontPairId: 'brutalist',
  },
  ownedSections: true,
  decorations: {
    marquee: { source: 'tagline' },
    filmGrain: true,
    nuclearWinterBg: true,
    scrollAnimation: true,
  },
  thumbnail: '/presets/nuclear-winter/thumb.png',
};
