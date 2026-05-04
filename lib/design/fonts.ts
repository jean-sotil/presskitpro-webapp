/**
 * `next/font/google` loaders for all 8 PRD §12.2 typography pairs.
 *
 * Architecture:
 *   - Each unique font is declared once below as a variable, e.g. `anton`.
 *   - Each font assigns a CSS variable `--font-<id>` Next can hash-scope.
 *   - `fontPairClasses` maps a pair id (from lib/design/tokens.ts) to a
 *     space-joined string of all the font classNames the pair needs.
 *   - Layouts apply `fontPairClasses[pairId]` to the root element.
 *
 * Subsetting:
 *   - All loaders use `latin + latin-ext` so PT-BR diacritics (ã, ç, ê, õ)
 *     render correctly. Verified manually on /_internal/preview.
 *
 * Weights:
 *   - Variable fonts: weight axis omitted (Next ships the variable file).
 *   - Static-only fonts: single weight pinned for byte budget.
 */
import {
  Anton,
  Archivo_Black,
  Bebas_Neue,
  Big_Shoulders,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Inter_Tight,
  JetBrains_Mono,
  Manrope,
  Outfit,
  Playfair_Display,
  Sora,
  Source_Sans_3,
  Space_Mono,
} from 'next/font/google';
import type { FontPairId } from './tokens';

// `next/font/google` requires statically-analyzable arguments — every loader
// below uses literal arrays for `subsets`, not a shared constant.

// ------- Display faces (static-only or condensed; pinned weight) -------

export const anton = Anton({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: '400',
  variable: '--font-anton',
});

export const archivoBlack = Archivo_Black({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: '400',
  variable: '--font-archivo-black',
});

export const bebasNeue = Bebas_Neue({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: '400',
  variable: '--font-bebas-neue',
});

// Google merged "Big Shoulders Display" into the main `Big_Shoulders` family;
// the display look comes from the variable optical-size (opsz) axis.
export const bigShouldersDisplay = Big_Shoulders({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-big-shoulders',
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

export const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-playfair',
});

// ------- Body faces (variable axis where available) -------

export const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-manrope',
});

export const interTight = Inter_Tight({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter-tight',
});

export const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-sora',
});

export const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-outfit',
});

export const sourceSans3 = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-source-sans',
});

// ------- Mono / spec faces -------

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const spaceMono = Space_Mono({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-space-mono',
});

// ------- Editorial italic (pair-1 only) -------

export const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});

/**
 * Map each pair id → the className(s) needed to declare its @font-face rules
 * AND the CSS-var aliases (--font-display / --font-body / --font-editorial)
 * pointing at the right fonts. We emit those aliases inline via `style` on
 * a wrapper, OR via a `data-font-pair` attribute combined with rules in
 * globals.css. Approach used here: classes only — globals.css maps the
 * default; the preview/profile-render path overrides with inline style.
 */
export const fontPairClasses: Record<FontPairId, string> = {
  'editorial-nightlife': `${anton.variable} ${manrope.variable} ${fraunces.variable}`,
  'magazine':            `${fraunces.variable} ${manrope.variable}`,
  'brutalist':           `${archivoBlack.variable} ${jetbrainsMono.variable}`,
  'refined':             `${cormorantGaramond.variable} ${interTight.variable}`,
  'industrial':          `${bigShouldersDisplay.variable} ${sora.variable}`,
  'soft-pop':            `${outfit.variable} ${dmSans.variable}`,
  'retro-future':        `${bebasNeue.variable} ${spaceMono.variable}`,
  'classic-press':       `${playfairDisplay.variable} ${sourceSans3.variable}`,
};

/**
 * Inline-style block for switching the active pair. Maps the three semantic
 * font CSS vars (--font-display, --font-body, --font-editorial) to the
 * concrete font vars from `next/font`. The default pair (Editorial Nightlife)
 * is also baked into globals.css so SSR has correct fonts before hydration —
 * this object is for the preview switcher and per-profile injection later.
 */
export const fontPairCssVars: Record<FontPairId, Record<string, string>> = {
  'editorial-nightlife': {
    '--font-display':   'var(--font-anton)',
    '--font-body':      'var(--font-manrope)',
    '--font-editorial': 'var(--font-fraunces)',
  },
  'magazine': {
    '--font-display':   'var(--font-fraunces)',
    '--font-body':      'var(--font-manrope)',
    '--font-editorial': 'var(--font-fraunces)',
  },
  'brutalist': {
    '--font-display':   'var(--font-archivo-black)',
    '--font-body':      'var(--font-jetbrains)',
    '--font-editorial': 'var(--font-jetbrains)',
  },
  'refined': {
    '--font-display':   'var(--font-cormorant)',
    '--font-body':      'var(--font-inter-tight)',
    '--font-editorial': 'var(--font-cormorant)',
  },
  'industrial': {
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
