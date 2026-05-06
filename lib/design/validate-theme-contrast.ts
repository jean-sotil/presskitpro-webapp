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
import type { DerivedTokens } from './derive-theme-tokens';

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

export function validateThemeContrast(tokens: DerivedTokens): ContrastResult {
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
