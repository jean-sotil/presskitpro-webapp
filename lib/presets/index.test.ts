import { describe, expect, it } from 'vitest';

import { fontPairs } from '@/lib/design/tokens';

import {
  DEFAULT_PRESET_ID,
  PRESETS,
  getDefaultPreset,
  getPresetById,
} from './index';

describe('preset registry', () => {
  it('ships at least the two POC presets', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(ids).toContain('mediakit-pro-v1');
    expect(ids).toContain('editorial-nightlife-v1');
  });

  it('ships the electric-fire-techno preset (task-35 follow-up)', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(ids).toContain('electric-fire-techno');
  });

  it('electric-fire-techno binds the spec colors and Bebas Neue font pair', () => {
    const preset = getPresetById('electric-fire-techno');
    expect(preset).not.toBeNull();
    // Per docs/presets/MediakitPRO_template_3.json: near-black bg with
    // blue undertone, fire-orange accent, Bebas Neue display ladder.
    expect(preset!.theme.bg).toBe('#09090F');
    expect(preset!.theme.accent).toBe('#FF4500');
    expect(preset!.theme.fontPairId).toBe('retro-future');
  });

  it('electric-fire-techno opts into the electricFire decoration bundle', () => {
    const preset = getPresetById('electric-fire-techno');
    // The decoration is what produces the spec's signature scanlines +
    // fire-edge gradients + gradient title + neon CTA glow on top of the
    // theme tokens. Without it the preset is just colors.
    expect(preset!.decorations?.electricFire).toBe(true);
  });

  it('preset ids are unique', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset references a valid fontPairId', () => {
    for (const preset of PRESETS) {
      expect(fontPairs).toContain(preset.theme.fontPairId);
    }
  });

  it('every preset declares a thumbnail under /presets/', () => {
    for (const preset of PRESETS) {
      expect(preset.thumbnail).toMatch(/^\/presets\/[\w-]+\/thumb\.(jpg|png|webp)$/);
    }
  });

  it('default preset is mediakit-pro-v1', () => {
    expect(DEFAULT_PRESET_ID).toBe('mediakit-pro-v1');
    expect(getDefaultPreset().id).toBe('mediakit-pro-v1');
  });

  describe('getPresetById', () => {
    it('returns the matching preset', () => {
      const preset = getPresetById('mediakit-pro-v1');
      expect(preset?.id).toBe('mediakit-pro-v1');
    });

    it('returns null for unknown ids', () => {
      expect(getPresetById('does-not-exist')).toBeNull();
    });

    it('returns null for nullish input', () => {
      expect(getPresetById(null)).toBeNull();
      expect(getPresetById(undefined)).toBeNull();
      expect(getPresetById('')).toBeNull();
    });
  });
});
