import { describe, expect, it } from 'vitest';

import { mintNonce } from './nonce';

describe('mintNonce', () => {
  it('returns a base64 string of length 24 (16 random bytes)', () => {
    const nonce = mintNonce();
    // 16 bytes -> 24 base64 chars (with '=' padding stripped/kept).
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$|^[A-Za-z0-9+/]{24}$/);
  });

  it('produces a different nonce on each call', () => {
    const a = mintNonce();
    const b = mintNonce();
    const c = mintNonce();
    expect(new Set([a, b, c]).size).toBe(3);
  });
});
