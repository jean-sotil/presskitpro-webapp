import { describe, expect, it } from 'vitest';

import { formatRelative } from './relative-time';

const NOW = new Date('2026-05-05T12:00:00.000Z').getTime();

function rel(deltaMs: number): string {
  return formatRelative(NOW - deltaMs, NOW, 'pt-BR');
}

describe('formatRelative', () => {
  it('returns "agora" for the current moment (< 5s)', () => {
    expect(rel(0)).toBe('agora');
    expect(rel(4_900)).toBe('agora');
  });

  it('formats seconds for < 1min', () => {
    expect(rel(12_000)).toMatch(/h(á|a) 12 s|12 s atrás/i);
  });

  it('formats minutes for 1m..1h', () => {
    const r = rel(4 * 60_000);
    expect(r).toMatch(/4 min/);
  });

  it('formats hours for 1h..24h', () => {
    const r = rel(3 * 60 * 60_000);
    expect(r).toMatch(/3 h/);
  });

  it('formats days for >= 24h', () => {
    const r = rel(2 * 24 * 60 * 60_000);
    expect(r).toMatch(/2 d/);
  });

  it('handles future timestamps gracefully (returns "agora" rather than "in N s")', () => {
    expect(formatRelative(NOW + 1_000, NOW, 'pt-BR')).toBe('agora');
  });

  it('accepts Date objects + ISO strings as the from arg', () => {
    expect(formatRelative(new Date(NOW - 12_000), NOW, 'pt-BR')).toMatch(/12/);
    expect(formatRelative(new Date(NOW - 12_000).toISOString(), NOW, 'pt-BR')).toMatch(/12/);
  });
});
