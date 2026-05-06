import { describe, expect, it } from 'vitest';

import { validateThemeContrast } from './validate-theme-contrast';

describe('validateThemeContrast', () => {
  it('passes a high-contrast pair', () => {
    const result = validateThemeContrast({
      bg: '#000000',
      accent: '#ffaa00',
      text: '#ffffff',
    });
    expect(result.ok).toBe(true);
    expect(result.ratios.textBg).toBeGreaterThanOrEqual(4.5);
    expect(result.ratios.accentBg).toBeGreaterThanOrEqual(3);
  });

  it('fails when text/bg < 4.5', () => {
    const result = validateThemeContrast({
      bg: '#ffffff',
      accent: '#0000ff',
      text: '#cccccc', // ~1.6:1 against white
    });
    expect(result.ok).toBe(false);
    expect(result.ratios.textBg).toBeLessThan(4.5);
    expect(result.failures).toContain('text-bg');
  });

  it('fails when accent/bg < 3', () => {
    const result = validateThemeContrast({
      bg: '#ffffff',
      accent: '#eeeeee', // very low contrast vs white
      text: '#000000',
    });
    expect(result.ok).toBe(false);
    expect(result.ratios.accentBg).toBeLessThan(3);
    expect(result.failures).toContain('accent-bg');
  });

  it('returns both failures when both pairs fail', () => {
    const result = validateThemeContrast({
      bg: '#ffffff',
      accent: '#eeeeee',
      text: '#cccccc',
    });
    expect(result.ok).toBe(false);
    expect(result.failures).toContain('text-bg');
    expect(result.failures).toContain('accent-bg');
  });

  it('passes the default theme baseline', () => {
    // The "Editorial Night" defaults must always pass — that's what
    // freshly-onboarded profiles ship with.
    const result = validateThemeContrast({
      bg: '#030303',
      accent: '#018A00',
      text: '#F0EDE6',
    });
    expect(result.ok).toBe(true);
  });
});
