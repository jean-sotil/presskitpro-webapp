/**
 * WCAG contrast utilities.
 *
 * `culori` ships a `wcagContrast` helper that takes any color string it can
 * parse (hex, rgb, oklch). We re-export thin wrappers so the rest of the
 * codebase doesn't take a direct dep on culori internals.
 */
import { wcagContrast } from 'culori';

export type ColorString = string;

/** Returns the WCAG SC 1.4.3 contrast ratio (1–21) for the two colors. */
export function contrastRatio(a: ColorString, b: ColorString): number {
  return wcagContrast(a, b);
}

/**
 * `true` if the contrast ratio passes the requested WCAG AA threshold.
 * Defaults to 4.5 (normal text); pass `3` for large text / non-text UI.
 */
export function passesAA(
  bg: ColorString,
  fg: ColorString,
  threshold: 4.5 | 3 = 4.5,
): boolean {
  return contrastRatio(bg, fg) >= threshold;
}
