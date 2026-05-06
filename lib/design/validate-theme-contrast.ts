/**
 * WCAG AA contrast gate for derived theme tokens.
 *
 * Two checks:
 *   - text vs bg ≥ 4.5:1 (WCAG SC 1.4.3 normal text)
 *   - accent vs bg ≥ 3:1   (WCAG SC 1.4.11 non-text UI)
 *
 * Pure module — same helper runs in the editor (instant feedback) and
 * in the theme PATCH route (server-enforced bump of `contrastValidatedAt`).
 */

import { contrastRatio } from './contrast';

export const MIN_TEXT_BG_RATIO = 4.5;
export const MIN_ACCENT_BG_RATIO = 3;

export type ContrastFailure = 'text-bg' | 'accent-bg';

export interface ContrastResult {
  ok: boolean;
  ratios: {
    textBg: number;
    accentBg: number;
  };
  failures: ContrastFailure[];
}

/** Validates contrast off the hex fields only — the OKLCH triplets on
 *  `DerivedTokens` aren't needed here. Accepting this narrower shape
 *  keeps the contrast helper independent of derive-theme-tokens. */
export interface ContrastInput {
  bg: string;
  accent: string;
  text: string;
}

export function validateThemeContrast(tokens: ContrastInput): ContrastResult {
  const textBg = contrastRatio(tokens.text, tokens.bg);
  const accentBg = contrastRatio(tokens.accent, tokens.bg);
  const failures: ContrastFailure[] = [];
  if (textBg < MIN_TEXT_BG_RATIO) failures.push('text-bg');
  if (accentBg < MIN_ACCENT_BG_RATIO) failures.push('accent-bg');
  return {
    ok: failures.length === 0,
    ratios: { textBg, accentBg },
    failures,
  };
}
