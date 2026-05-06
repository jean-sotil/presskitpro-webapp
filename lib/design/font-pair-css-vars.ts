/**
 * Pure data — maps each FontPairId to the three semantic CSS-var
 * overrides that Tailwind reads (`--font-display`, `--font-body`,
 * `--font-editorial`).
 *
 * Lives in its own file so consumers like `ProfileRenderer` (which
 * runs under vitest in tests) don't have to import `next/font/google`
 * loaders to read the mapping.
 */

import type { FontPairId } from './tokens';

export const fontPairCssVars: Record<FontPairId, Record<string, string>> = {
  'editorial-nightlife': {
    '--font-display':   'var(--font-anton)',
    '--font-body':      'var(--font-manrope)',
    '--font-editorial': 'var(--font-fraunces)',
  },
  magazine: {
    '--font-display':   'var(--font-fraunces)',
    '--font-body':      'var(--font-manrope)',
    '--font-editorial': 'var(--font-fraunces)',
  },
  brutalist: {
    '--font-display':   'var(--font-archivo-black)',
    '--font-body':      'var(--font-jetbrains)',
    '--font-editorial': 'var(--font-jetbrains)',
  },
  refined: {
    '--font-display':   'var(--font-cormorant)',
    '--font-body':      'var(--font-inter-tight)',
    '--font-editorial': 'var(--font-cormorant)',
  },
  industrial: {
    '--font-display':   'var(--font-big-shoulders)',
    '--font-body':      'var(--font-sora)',
    '--font-editorial': 'var(--font-sora)',
  },
  'soft-pop': {
    '--font-display':   'var(--font-outfit)',
    '--font-body':      'var(--font-dm-sans)',
    '--font-editorial': 'var(--font-dm-sans)',
  },
  'retro-future': {
    '--font-display':   'var(--font-bebas-neue)',
    '--font-body':      'var(--font-space-mono)',
    '--font-editorial': 'var(--font-space-mono)',
  },
  'classic-press': {
    '--font-display':   'var(--font-playfair)',
    '--font-body':      'var(--font-source-sans)',
    '--font-editorial': 'var(--font-playfair)',
  },
};
