import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  signKeepSlugToken,
  verifyKeepSlugToken,
} from './keep-slug-token';

describe('keep-slug-token', () => {
  beforeEach(() => {
    vi.stubEnv('KEEP_SLUG_TOKEN_SECRET', 'test-secret-of-sufficient-length');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('round-trips a valid token (sign → verify)', () => {
    const tok = signKeepSlugToken({ profileId: 42, warningAt: '2026-05-01T00:00:00Z' });
    const r = verifyKeepSlugToken(tok);
    expect(r).toEqual({
      ok: true,
      profileId: '42',
      warningAt: '2026-05-01T00:00:00Z',
    });
  });

  it('rejects a tampered token (signature mismatch)', () => {
    const tok = signKeepSlugToken({ profileId: 1, warningAt: '2026-05-01T00:00:00Z' });
    // Flip the tail of the signature — token shape stays valid
    // (`payload.signature`) but the HMAC check fails.
    const [payloadB64, sigB64] = tok.split('.') as [string, string];
    const tampered = `${payloadB64}.${sigB64.slice(0, -3)}AAA`;
    expect(verifyKeepSlugToken(tampered)).toEqual({ ok: false, reason: 'invalid-signature' });
  });

  it('rejects a missing/empty token', () => {
    expect(verifyKeepSlugToken('')).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyKeepSlugToken('foo.bar')).toEqual({ ok: false, reason: 'malformed' });
  });

  it('throws when the env secret is unset (configuration error)', () => {
    vi.stubEnv('KEEP_SLUG_TOKEN_SECRET', '');
    expect(() => signKeepSlugToken({ profileId: 1, warningAt: '2026-05-01T00:00:00Z' }))
      .toThrowError(/KEEP_SLUG_TOKEN_SECRET/);
  });

  it('rejects when env secret is rotated mid-flight', () => {
    const tok = signKeepSlugToken({ profileId: 1, warningAt: '2026-05-01T00:00:00Z' });
    vi.stubEnv('KEEP_SLUG_TOKEN_SECRET', 'a-different-secret');
    expect(verifyKeepSlugToken(tok)).toEqual({ ok: false, reason: 'invalid-signature' });
  });
});
