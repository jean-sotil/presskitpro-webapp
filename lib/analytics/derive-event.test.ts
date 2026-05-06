import { describe, expect, it } from 'vitest';

import { deriveProfileSlugFromPath, deriveReferrerHost, deriveLocale } from './derive-event';

describe('deriveProfileSlugFromPath', () => {
  it('extracts a top-level slug', () => {
    expect(deriveProfileSlugFromPath('/mariana')).toBe('mariana');
  });

  it('returns null for the root path', () => {
    expect(deriveProfileSlugFromPath('/')).toBe(null);
  });

  it('returns null for nested paths (only profile pages count)', () => {
    expect(deriveProfileSlugFromPath('/dashboard/profile/12')).toBe(null);
    expect(deriveProfileSlugFromPath('/mariana/extra')).toBe(null);
  });

  it('returns null for known reserved app paths', () => {
    for (const p of ['/api/track', '/dashboard', '/login', '/signup', '/onboarding', '/checkout', '/pricing']) {
      expect(deriveProfileSlugFromPath(p)).toBe(null);
    }
  });

  it('strips trailing slash and query', () => {
    expect(deriveProfileSlugFromPath('/mariana/?utm=x')).toBe('mariana');
  });
});

describe('deriveReferrerHost', () => {
  it('returns the bare host', () => {
    expect(deriveReferrerHost('https://www.google.com/search?q=mariana+dj')).toBe('www.google.com');
  });

  it('returns null for empty / missing referrer', () => {
    expect(deriveReferrerHost(null)).toBe(null);
    expect(deriveReferrerHost(undefined)).toBe(null);
    expect(deriveReferrerHost('')).toBe(null);
  });

  it('returns null for malformed URLs (never throws)', () => {
    expect(deriveReferrerHost('not a url')).toBe(null);
  });

  it('strips path + query from the referrer (PII guard per plan-doc R5)', () => {
    // The host is the only thing that should leave the request handler.
    const host = deriveReferrerHost('https://t.co/AbCd?ref=secret');
    expect(host).toBe('t.co');
    expect(host).not.toMatch(/secret/);
  });

  it('returns null when the referrer is the same host as the page (self-link)', () => {
    expect(
      deriveReferrerHost('https://presskit.pro/marketing', { selfHost: 'presskit.pro' }),
    ).toBe(null);
  });
});

describe('deriveLocale', () => {
  it('returns the primary tag from Accept-Language', () => {
    expect(deriveLocale('pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt-BR');
  });

  it('returns null on a missing header', () => {
    expect(deriveLocale(null)).toBe(null);
    expect(deriveLocale(undefined)).toBe(null);
  });

  it('caps overlong values to keep the row light', () => {
    const long = 'a'.repeat(500);
    expect(deriveLocale(long)?.length).toBeLessThanOrEqual(20);
  });
});
