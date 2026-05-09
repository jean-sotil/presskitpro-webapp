import type { Preset } from './types';

/**
 * Dead Signal
 */
export const deadSignal: Preset = {
  id: 'dead-signal',
  name: 'Dead Signal',
  tagline:
    'Estética cyber e glitch-art. Linhas duras, scanlines de TV e aberração cromática em tons de ciano e vermelho.',
  theme: {
    bgPresetId: 'obsidian',
    accentPresetId: 'signal-red',
    bg: '#000000',
    accent: '#ef4444',
    text: '#f3f4f6',
    fontPairId: 'brutalist',
  },
  ownedSections: true,
  decorations: {
    marquee: { source: 'tagline' },
    filmGrain: true,
    deadSignalBg: true,
    scrollAnimation: true,
  },
  thumbnail: '/presets/dead-signal/thumb.png',
};
