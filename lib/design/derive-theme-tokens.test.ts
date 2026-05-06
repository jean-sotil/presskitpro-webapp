import { describe, expect, it } from 'vitest';

import { deriveThemeTokens } from './derive-theme-tokens';

describe('deriveThemeTokens', () => {
  it('returns the default tokens when the theme is null/empty', () => {
    const t = deriveThemeTokens(null);
    expect(t.bg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.text).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.accentContrast).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('uses preset hex values when colorPresetId is set', () => {
    const t = deriveThemeTokens({
      colorPresetId: 'paper-white',
      accentPresetId: 'cobalt',
    } as never);
    expect(t.bg.toLowerCase()).toBe('#f5f3f0');
    expect(t.accent.toLowerCase()).toBe('#204ee3');
  });

  it('overrides bg with custom hex when present', () => {
    const t = deriveThemeTokens({
      colorPresetId: 'editorial-night',
      bg: '#000000',
    } as never);
    expect(t.bg.toLowerCase()).toBe('#000000');
  });

  it('overrides accent with custom hex', () => {
    const t = deriveThemeTokens({
      accent: '#abcdef',
    } as never);
    expect(t.accent.toLowerCase()).toBe('#abcdef');
  });

  it('uses explicit text override when provided', () => {
    const t = deriveThemeTokens({
      bg: '#ffffff',
      text: '#123456',
    } as never);
    expect(t.text.toLowerCase()).toBe('#123456');
  });

  it('auto-derives a light text on a dark bg when text is empty', () => {
    const t = deriveThemeTokens({ bg: '#000000' } as never);
    // Auto text for dark mode is light.
    expect(parseInt(t.text.slice(1), 16)).toBeGreaterThan(0xaaaaaa);
  });

  it('auto-derives a dark text on a light bg when text is empty', () => {
    const t = deriveThemeTokens({ bg: '#ffffff' } as never);
    expect(parseInt(t.text.slice(1), 16)).toBeLessThan(0x444444);
  });

  it('normalizes hex to uppercase 6-digit form', () => {
    const t = deriveThemeTokens({ bg: '#abc' } as never);
    expect(t.bg).toMatch(/^#[0-9A-F]{6}$/);
    expect(t.bg.toUpperCase()).toBe('#AABBCC');
  });

  it('rejects malformed hex by falling back to the preset / default', () => {
    const t = deriveThemeTokens({
      colorPresetId: 'editorial-night',
      bg: 'not-a-hex',
    } as never);
    expect(t.bg.toLowerCase()).toBe('#030303');
  });

  it('emits OKLCH triplets ("L C H") in the bg/accent/text/accentContrast aliases', () => {
    const t = deriveThemeTokens({ bg: '#ffffff' } as never);
    // White → L close to 1, C ≈ 0.
    expect(t.bgOklch).toMatch(/^[\d.]+ [\d.]+ [\d.]+$/);
    expect(parseFloat(t.bgOklch.split(' ')[0]!)).toBeGreaterThan(0.95);
    const black = deriveThemeTokens({ bg: '#000000' } as never);
    expect(parseFloat(black.bgOklch.split(' ')[0]!)).toBe(0);
  });
});
