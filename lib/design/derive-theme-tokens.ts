/**
 * Derives the canonical theme token set from a stored Theme record.
 *
 * Resolution order per field:
 *   1. Per-field custom hex (e.g. `theme.bg`) when present and well-formed.
 *   2. Preset value (e.g. `theme.colorPresetId` → `bgPresets[…]`).
 *   3. Default tokens (the "Editorial Night" baseline from §12.1).
 *
 * `text` falls back to `autoText` based on the bg's `mode` when not set.
 *
 * Pure module — same helper runs in the editor (live preview),
 * in the theme PATCH route (server-side gate), and in `ProfileRenderer`
 * (CSS-variable injection at render time). One source of truth.
 */

import { converter, wcagContrast } from 'culori';

import {
  accentPresets,
  autoText,
  bgPresets,
  defaultTokens,
  type ColorPreset,
  type BgPreset,
  type ThemeMode,
} from './tokens';

export interface DerivedTokens {
  bg: string;
  accent: string;
  text: string;
  accentContrast: string;
  /** OKLCH triplets ("L C H") — what Tailwind's `bg-bg` etc. expect.
   *  Tailwind generates `oklch(var(--bg) / <alpha>)`; the values must be
   *  the bare triplet. */
  bgOklch: string;
  accentOklch: string;
  textOklch: string;
  accentContrastOklch: string;
  /** Extra metadata for the editor — which mode the bg is in (so the
   *  preview can default the auto-text correctly). */
  bgMode: ThemeMode;
}

interface RawTheme {
  colorPresetId?: string | null;
  /** Optional accent preset id — distinct from `colorPresetId` (which is
   *  the bg preset). The schema currently overloads the field name; the
   *  editor sends `accentPresetId` separately. */
  accentPresetId?: string | null;
  bg?: string | null;
  accent?: string | null;
  text?: string | null;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function deriveThemeTokens(theme: RawTheme | null | undefined): DerivedTokens {
  const safe = theme ?? {};

  const bgPreset = pickBgPreset(safe.colorPresetId);
  const accentPreset = pickAccentPreset(safe.accentPresetId);

  const fallbackBgHex = defaultTokens.bg?.hex ?? '#030303';
  const fallbackAccentHex = defaultTokens.accent?.hex ?? '#018A00';
  const bgHex = normalizeHex(safe.bg) ?? bgPreset?.hex ?? fallbackBgHex;
  const accentHex =
    normalizeHex(safe.accent) ?? accentPreset?.hex ?? fallbackAccentHex;

  const bgMode = detectBgMode(bgHex);
  const textHex =
    normalizeHex(safe.text) ?? autoText[bgMode].hex;

  // Accent-contrast: pick black/white for whichever has more contrast against
  // the accent. Used by buttons that bg-color === accent.
  const accentContrast = pickAccentContrast(accentHex);

  return {
    bg: bgHex.toUpperCase(),
    accent: accentHex.toUpperCase(),
    text: textHex.toUpperCase(),
    accentContrast: accentContrast.toUpperCase(),
    bgOklch: hexToOklchTriplet(bgHex),
    accentOklch: hexToOklchTriplet(accentHex),
    textOklch: hexToOklchTriplet(textHex),
    accentContrastOklch: hexToOklchTriplet(accentContrast),
    bgMode,
  };
}

const toOklch = converter('oklch');

/** Format hex as Tailwind-compatible OKLCH triplet `"L C H"` with 3
 *  decimals. Achromatic colors (where culori returns h=undefined or NaN)
 *  emit hue=0. */
export function hexToOklchTriplet(hex: string): string {
  const parsed = toOklch(hex);
  if (!parsed) return '0 0 0';
  const l = Number.isFinite(parsed.l) ? parsed.l : 0;
  const c = Number.isFinite(parsed.c) ? parsed.c : 0;
  const h = Number.isFinite(parsed.h) ? (parsed.h as number) : 0;
  const round = (n: number) => Number(n.toFixed(3));
  return `${round(l)} ${round(c)} ${round(h)}`;
}

function pickBgPreset(id: string | null | undefined): BgPreset | undefined {
  if (!id) return undefined;
  return bgPresets.find((p) => p.id === id);
}

function pickAccentPreset(id: string | null | undefined): ColorPreset | undefined {
  if (!id) return undefined;
  return accentPresets.find((p) => p.id === id);
}

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  const stripped = trimmed.replace(/^#/, '');
  if (stripped.length === 3) {
    const [r, g, b] = stripped;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return `#${stripped.toUpperCase()}`;
}

function detectBgMode(bgHex: string): ThemeMode {
  // Approximate luminance: average channel. Good enough for picking a
  // light/dark text fallback; the actual contrast ratio is enforced by
  // `validateThemeContrast` after derivation.
  const stripped = bgHex.replace(/^#/, '');
  const r = parseInt(stripped.slice(0, 2), 16);
  const g = parseInt(stripped.slice(2, 4), 16);
  const b = parseInt(stripped.slice(4, 6), 16);
  const avg = (r + g + b) / 3;
  return avg < 128 ? 'dark' : 'light';
}

function pickAccentContrast(accentHex: string): string {
  const blackRatio = wcagContrast(accentHex, '#000000');
  const whiteRatio = wcagContrast(accentHex, '#ffffff');
  return blackRatio >= whiteRatio ? '#000000' : '#ffffff';
}
