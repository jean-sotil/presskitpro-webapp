import { describe, expect, it } from 'vitest';

import { buildApplyPresetPatch } from './apply-preset';
import { editorialNightlifeV1 } from './editorial-nightlife-v1';
import { mediakitProV1 } from './mediakit-pro-v1';

describe('buildApplyPresetPatch', () => {
  it('writes the preset id', () => {
    expect(buildApplyPresetPatch(mediakitProV1).presetId).toBe('mediakit-pro-v1');
  });

  it('mirrors the bg/accent preset ids and hex tokens', () => {
    const patch = buildApplyPresetPatch(mediakitProV1);
    expect(patch.colorPresetId).toBe(mediakitProV1.theme.bgPresetId);
    expect(patch.accentPresetId).toBe(mediakitProV1.theme.accentPresetId);
    expect(patch.bg).toBe(mediakitProV1.theme.bg);
    expect(patch.accent).toBe(mediakitProV1.theme.accent);
  });

  it('mirrors the fontPairId', () => {
    expect(buildApplyPresetPatch(editorialNightlifeV1).fontPairId).toBe(
      editorialNightlifeV1.theme.fontPairId,
    );
  });

  it('passes through text when defined, null otherwise', () => {
    expect(buildApplyPresetPatch(mediakitProV1).text).toBe(mediakitProV1.theme.text);
    const noText = { ...editorialNightlifeV1, theme: { ...editorialNightlifeV1.theme, text: undefined } };
    expect(buildApplyPresetPatch(noText).text).toBeNull();
  });

  it('clears contrastValidatedAt so the contrast gate runs again', () => {
    expect(buildApplyPresetPatch(mediakitProV1).contrastValidatedAt).toBeNull();
  });
});
