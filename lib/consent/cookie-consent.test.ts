import { describe, expect, it } from 'vitest';

import {
  CONSENT_COOKIE_NAME,
  CONSENT_COOKIE_VALUE,
  hasConsent,
  serializeConsentCookie,
} from './cookie-consent';

describe('hasConsent', () => {
  it('returns false when the cookie header is empty or missing', () => {
    expect(hasConsent('')).toBe(false);
    expect(hasConsent(undefined)).toBe(false);
  });

  it('returns true only when the consent cookie equals the expected value', () => {
    expect(hasConsent(`${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}`)).toBe(true);
    expect(hasConsent(`${CONSENT_COOKIE_NAME}=somethingelse`)).toBe(false);
    expect(hasConsent(`other=${CONSENT_COOKIE_VALUE}`)).toBe(false);
  });

  it('parses the cookie among many cookies', () => {
    const header = [
      'sb-access-token=xyz',
      `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}`,
      'NEXT_LOCALE=pt-BR',
    ].join('; ');
    expect(hasConsent(header)).toBe(true);
  });
});

describe('serializeConsentCookie', () => {
  it('produces a 1-year, lax, root-path cookie', () => {
    const out = serializeConsentCookie();
    expect(out).toContain(`${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}`);
    expect(out).toContain('Path=/');
    expect(out).toContain('Max-Age=31536000');
    expect(out).toContain('SameSite=Lax');
  });
});
