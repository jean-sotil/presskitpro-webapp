import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from './symmetric';

const KEY_A = Buffer.alloc(32, 1).toString('base64');
const KEY_B = Buffer.alloc(32, 2).toString('base64');

describe('symmetric crypto', () => {
  describe('encrypt / decrypt round-trip', () => {
    it('returns the plaintext when decrypted with the same key', () => {
      const plaintext = 'IGQVJX-very-secret-token';
      const ciphertext = encrypt(plaintext, KEY_A);
      expect(decrypt(ciphertext, KEY_A)).toBe(plaintext);
    });

    it('produces a different ciphertext on each call (random IV)', () => {
      const plaintext = 'same-input';
      const a = encrypt(plaintext, KEY_A);
      const b = encrypt(plaintext, KEY_A);
      expect(a).not.toBe(b);
      expect(decrypt(a, KEY_A)).toBe(plaintext);
      expect(decrypt(b, KEY_A)).toBe(plaintext);
    });

    it('preserves multi-byte UTF-8 content', () => {
      const plaintext = 'café — 你好 — 🎧';
      expect(decrypt(encrypt(plaintext, KEY_A), KEY_A)).toBe(plaintext);
    });

    it('emits the documented `iv.tag.ciphertext` shape (three base64 segments)', () => {
      const ciphertext = encrypt('x', KEY_A);
      const parts = ciphertext.split('.');
      expect(parts).toHaveLength(3);
      // 12-byte IV → 16 base64 chars (no padding because 12 is a multiple of 3).
      expect(parts[0]).toHaveLength(16);
      // 16-byte GCM auth tag → 24 base64 chars.
      expect(parts[1]).toHaveLength(24);
      expect(parts[2]!.length).toBeGreaterThan(0);
    });
  });

  describe('failure modes', () => {
    it('throws when the wrong key is used', () => {
      const ciphertext = encrypt('secret', KEY_A);
      expect(() => decrypt(ciphertext, KEY_B)).toThrow();
    });

    it('throws on a tampered auth tag (GCM integrity)', () => {
      const ciphertext = encrypt('secret', KEY_A);
      const [iv, tag, body] = ciphertext.split('.');
      // Flip a single bit in the tag.
      const tagBuf = Buffer.from(tag!, 'base64');
      tagBuf[0] = tagBuf[0]! ^ 0x01;
      const tampered = `${iv}.${tagBuf.toString('base64')}.${body}`;
      expect(() => decrypt(tampered, KEY_A)).toThrow();
    });

    it('throws on a malformed ciphertext (wrong segment count)', () => {
      expect(() => decrypt('not-a-real-ciphertext', KEY_A)).toThrow();
      expect(() => decrypt('only.two', KEY_A)).toThrow();
    });

    it('throws when the key is not a 32-byte base64 string', () => {
      expect(() => encrypt('x', 'too-short')).toThrow();
      expect(() => encrypt('x', Buffer.alloc(16, 1).toString('base64'))).toThrow();
    });
  });
});
