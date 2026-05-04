import { describe, expect, it } from 'vitest';
import { contrastRatio, passesAA } from './contrast';

/**
 * Fixtures taken from WCAG SC 1.4.3 worked examples and the W3C contrast
 * checker. Values are accepted within ±0.05 to absorb floating-point drift
 * across color libraries.
 */

describe('contrastRatio', () => {
  it('returns 21 for black against white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#7a7670', '#7a7670')).toBeCloseTo(1, 1);
  });

  it('is symmetric', () => {
    const a = contrastRatio('#0a0a0a', '#00cc6a');
    const b = contrastRatio('#00cc6a', '#0a0a0a');
    expect(a).toBeCloseTo(b, 5);
  });

  it('agrees with the canonical white-on-#777 example (≈ 4.48)', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });
});

describe('passesAA', () => {
  it('passes 4.5:1 for default 4.5 threshold', () => {
    expect(passesAA('#000000', '#ffffff')).toBe(true);
  });

  it('fails for low-contrast pairs at the 4.5 default', () => {
    expect(passesAA('#aaaaaa', '#cccccc')).toBe(false);
  });

  it('uses the 3:1 large-text/UI threshold when requested', () => {
    // mid-grey pair that passes 3:1 but not 4.5:1
    expect(passesAA('#888888', '#ffffff', 3)).toBe(true);
    expect(passesAA('#888888', '#ffffff', 4.5)).toBe(false);
  });
});
