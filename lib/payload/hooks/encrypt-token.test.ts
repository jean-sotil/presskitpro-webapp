import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decrypt } from '../../crypto/symmetric';
import { decryptTokenAfterRead, encryptTokenBeforeChange } from './encrypt-token';

const KEY = Buffer.alloc(32, 7).toString('base64');

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('INSTAGRAM_TOKEN_ENCRYPTION_KEY', KEY);
});

describe('encryptTokenBeforeChange', () => {
  it('encrypts a fresh plaintext token', () => {
    const out = encryptTokenBeforeChange({ value: 'IGQVJX-secret', operation: 'create' });
    expect(out).not.toBe('IGQVJX-secret');
    expect(out!.split('.').length).toBe(3);
    expect(decrypt(out!, KEY)).toBe('IGQVJX-secret');
  });

  it('returns undefined when value is undefined', () => {
    expect(
      encryptTokenBeforeChange({ value: undefined, operation: 'create' }),
    ).toBeUndefined();
  });

  it('passes through a value that is already a v1 ciphertext (idempotent on update)', () => {
    const ciphertext = encryptTokenBeforeChange({ value: 'tok', operation: 'create' })!;
    const out = encryptTokenBeforeChange({ value: ciphertext, operation: 'update' });
    expect(out).toBe(ciphertext);
  });

  it('throws when the env var is missing', () => {
    vi.stubEnv('INSTAGRAM_TOKEN_ENCRYPTION_KEY', '');
    expect(() =>
      encryptTokenBeforeChange({ value: 'tok', operation: 'create' }),
    ).toThrow(/INSTAGRAM_TOKEN_ENCRYPTION_KEY/);
  });
});

describe('decryptTokenAfterRead', () => {
  it('decrypts a stored ciphertext', () => {
    const ciphertext = encryptTokenBeforeChange({ value: 'plain', operation: 'create' })!;
    expect(decryptTokenAfterRead({ value: ciphertext })).toBe('plain');
  });

  it('returns undefined when value is undefined', () => {
    expect(decryptTokenAfterRead({ value: undefined })).toBeUndefined();
  });

  it('returns the original value if it is not a v1 ciphertext (legacy/seed data tolerance)', () => {
    expect(decryptTokenAfterRead({ value: 'not-encrypted' })).toBe('not-encrypted');
  });
});
