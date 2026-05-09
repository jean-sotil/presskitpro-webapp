import type { Preset } from './types';

/**
 * Nuclear Winter
 * Desolate, radioactive industrial aesthetic. Cold grays, toxic greens,
 * and glitchy warning indicators.
 */
export const nuclearWinter: Preset = {
  id: 'nuclear-winter',
  name: 'Nuclear Winter',
  tagline:
    'Estética pós-apocalíptica e radioativa. Tons frios de cinza, verde tóxico fluorescente e indicadores de alerta.',
  theme: {
    bgPresetId: 'editorial-night',
    accentPresetId: 'electric-green',
    bg: '#050705',
    accent: '#39ff14',
    text: '#a0b0a0',
    fontPairId: 'industrial',
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
