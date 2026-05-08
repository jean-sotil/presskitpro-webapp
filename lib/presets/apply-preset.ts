import type { FontPairId } from '@/lib/design/tokens';

import type { Preset } from './types';

/**
 * The patch the editor's `applyPresetAction` writes onto the profile's
 * `Themes` row. Color/font tokens are propagated so the contrast gate
 * (task-18) runs against the *new* palette; `contrastValidatedAt` is
 * cleared so re-publish requires a fresh contrast pass.
 *
 * `presetId` is the source of truth for section variants — the legacy
 * `heroStyle` / `galleryLayout` columns stay untouched and only act as
 * fallbacks when `presetId` is null.
 */
export type ApplyPresetPatch = {
  presetId: string;
  colorPresetId: string;
  accentPresetId: string;
  bg: string;
  accent: string;
  text: string | null;
  fontPairId: FontPairId;
  contrastValidatedAt: null;
};

export function buildApplyPresetPatch(preset: Preset): ApplyPresetPatch {
  return {
    presetId: preset.id,
    colorPresetId: preset.theme.bgPresetId,
    accentPresetId: preset.theme.accentPresetId,
    bg: preset.theme.bg,
    accent: preset.theme.accent,
    text: preset.theme.text ?? null,
    fontPairId: preset.theme.fontPairId,
    contrastValidatedAt: null,
  };
}
