import type { Preset } from './types';

/**
 * Bunker 909
 * Industrial techno aesthetic inspired by underground bunkers and the TR-909.
 */
export const bunker909: Preset = {
  id: 'bunker-909',
  name: 'Bunker 909',
  tagline:
    'Estética industrial e brutalista. Concreto, grades metálicas e o clássico laranja 909 sobre preto profundo.',
  theme: {
    bgPresetId: 'obsidian',
    accentPresetId: 'festival-orange',
    bg: '#0a0a0a',
    accent: '#ff5c00',
    text: '#e5e5e5',
    fontPairId: 'brutalist',
  },
  ownedSections: true,
  decorations: {
    marquee: { source: 'displayName' },
    filmGrain: true,
    bunker909Bg: true,
  },
  thumbnail: '/presets/bunker-909/thumb.png',
};
