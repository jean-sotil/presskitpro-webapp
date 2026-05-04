/**
 * Design tokens — single source of truth for the design system.
 *
 * Two consumers:
 *   1. `app/globals.css` writes the *default theme's* values to :root as OKLCH.
 *   2. `scripts/contrast-check.ts` runs the 6×12 preset matrix through WCAG.
 *
 * Per PRD §12, locked rules (spacing scale, type scale, line heights, motion
 * timings) are NOT user-customizable — they live in tailwind.config.ts as
 * theme constants, not here.
 */

export type ThemeMode = 'dark' | 'light';

export type ColorPreset = {
  /** Stable id used as a `data-bg`/`data-accent` value and in the editor. */
  id: string;
  /** Display label (PT-BR primary). */
  label: string;
  /** OKLCH triplet without the wrapping `oklch()` function — `L C H`. */
  oklch: string;
  /** Hex fallback, used by the contrast script and in non-OKLCH browsers. */
  hex: string;
};

export type BgPreset = ColorPreset & { mode: ThemeMode };

/**
 * 6 curated background presets per PRD §12.2.
 * The default ("editorial-night") matches §12.1.
 */
export const bgPresets: readonly BgPreset[] = [
  { id: 'editorial-night', label: 'Editorial Night', oklch: '0.094 0 0',       hex: '#030303', mode: 'dark'  },
  { id: 'raw-concrete',    label: 'Raw Concrete',    oklch: '0.110 0.005 70',  hex: '#050403', mode: 'dark'  },
  { id: 'blueprint',       label: 'Blueprint',       oklch: '0.115 0.020 240', hex: '#01060b', mode: 'dark'  },
  { id: 'paper-white',     label: 'Paper White',     oklch: '0.965 0.005 80',  hex: '#f5f3f0', mode: 'light' },
  { id: 'bone',            label: 'Bone',            oklch: '0.955 0.003 60',  hex: '#f2f0ee', mode: 'light' },
  { id: 'cream',           label: 'Cream',           oklch: '0.970 0.015 85',  hex: '#faf5ea', mode: 'light' },
] as const;

/**
 * 12 curated accent presets per PRD §12.2.
 * Picked to satisfy WCAG AA (≥ 3:1) against every bg preset above; verified
 * by `pnpm contrast:check`.
 */
export const accentPresets: readonly ColorPreset[] = [
  { id: 'electric-green', label: 'Electric Green', oklch: '0.550 0.190 142', hex: '#018a00' },
  { id: 'hot-pink',       label: 'Hot Pink',       oklch: '0.550 0.230 0',   hex: '#d0006c' },
  { id: 'signal-red',     label: 'Signal Red',     oklch: '0.500 0.220 27',  hex: '#c20000' },
  { id: 'amber',          label: 'Amber',          oklch: '0.550 0.170 65',  hex: '#b25500' },
  { id: 'cobalt',         label: 'Cobalt',         oklch: '0.500 0.230 265', hex: '#204ee3' },
  { id: 'ultraviolet',    label: 'Ultraviolet',    oklch: '0.520 0.250 295', hex: '#7a2de5' },
  { id: 'crimson',        label: 'Crimson',        oklch: '0.500 0.210 12',  hex: '#bc0042' },
  { id: 'forest',         label: 'Forest',         oklch: '0.500 0.130 155', hex: '#007840' },
  { id: 'plum',           label: 'Plum',           oklch: '0.500 0.170 320', hex: '#8c399e' },
  { id: 'magenta',        label: 'Magenta',        oklch: '0.550 0.270 330', hex: '#bf00b9' },
  { id: 'ink-blue',       label: 'Ink Blue',       oklch: '0.480 0.140 250', hex: '#005fa8' },
  { id: 'burnt-orange',   label: 'Burnt Orange',   oklch: '0.550 0.170 45',  hex: '#bd4600' },
] as const;

/**
 * Auto-derived text colors per `bg.mode`. These are the values the editor
 * picks when the user doesn't override (PRD §12.2: "auto-derived from `bg`").
 */
export const autoText: Record<ThemeMode, { hex: string; oklch: string }> = {
  dark:  { hex: '#edeae4', oklch: '0.938 0.009 88' },
  light: { hex: '#13110f', oklch: '0.180 0.005 70' },
};

/**
 * Default-theme tokens (PRD §12.1).
 * Mirrored in :root in app/globals.css; this object lets TS code reference
 * them by name (e.g., for the contrast script's "default" baseline).
 */
export const defaultTokens = {
  bg:               bgPresets[0],
  surface:          { oklch: '0.155 0 0', hex: '#141414' },
  border:           { oklch: '0.218 0 0', hex: '#1f1f1f' },
  text:             { oklch: '0.938 0.009 88', hex: '#f0ede6' },
  textMuted:        { oklch: '0.515 0.008 75', hex: '#7a7670' },
  accent:           accentPresets[0],
  accentContrast:   { oklch: '0.094 0 0', hex: '#0a0a0a' },
  grainOpacity:     0.04,
} as const;

/**
 * 8 font-pair ids per PRD §12.2. Names match the PRD verbatim.
 * The actual `next/font` loaders live in `app/fonts.ts` and key on these ids.
 */
export const fontPairs = [
  'editorial-nightlife',
  'magazine',
  'brutalist',
  'refined',
  'industrial',
  'soft-pop',
  'retro-future',
  'classic-press',
] as const;

export type FontPairId = (typeof fontPairs)[number];

export const DEFAULT_FONT_PAIR: FontPairId = 'editorial-nightlife';
