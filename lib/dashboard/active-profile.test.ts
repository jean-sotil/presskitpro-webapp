import { describe, expect, it } from 'vitest';

import {
  ACTIVE_PROFILE_COOKIE_NAME,
  parseActiveProfileCookie,
  serializeActiveProfileCookie,
} from './active-profile';

describe('parseActiveProfileCookie', () => {
  it('returns null on missing or empty headers', () => {
    expect(parseActiveProfileCookie(null)).toBeNull();
    expect(parseActiveProfileCookie('')).toBeNull();
  });

  it('extracts the profile id when present', () => {
    expect(
      parseActiveProfileCookie(`${ACTIVE_PROFILE_COOKIE_NAME}=42`),
    ).toBe('42');
  });

  it('finds the cookie among many', () => {
    const header = [
      'sb-access-token=abc',
      `${ACTIVE_PROFILE_COOKIE_NAME}=99`,
      'NEXT_LOCALE=pt',
    ].join('; ');
    expect(parseActiveProfileCookie(header)).toBe('99');
  });

  it('rejects empty values (clears the cookie)', () => {
    expect(parseActiveProfileCookie(`${ACTIVE_PROFILE_COOKIE_NAME}=`)).toBeNull();
  });
});

describe('serializeActiveProfileCookie', () => {
  it('encodes the profile id in a 1-year, lax, root-path cookie', () => {
    const out = serializeActiveProfileCookie('42');
    expect(out).toContain(`${ACTIVE_PROFILE_COOKIE_NAME}=42`);
    expect(out).toContain('Path=/');
    expect(out).toContain('SameSite=Lax');
    expect(out).toContain('Max-Age=31536000');
  });

  it('rejects empty/invalid ids by returning a clearing cookie', () => {
    const cleared = serializeActiveProfileCookie('');
    expect(cleared).toContain(`${ACTIVE_PROFILE_COOKIE_NAME}=`);
    expect(cleared).toContain('Max-Age=0');
  });
});
