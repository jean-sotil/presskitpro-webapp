/**
 * AES-256-GCM symmetric encryption for at-rest secrets (e.g. IG access tokens
 * — see `payload/collections/InstagramConnections.ts`).
 *
 * Output format: `iv.tag.ciphertext`, each segment base64-encoded. A random
 * 12-byte IV is generated per call; the 16-byte GCM auth tag protects against
 * tampering (decrypt throws if the tag, IV, or ciphertext is altered).
 *
 * Key format: 32-byte (256-bit) base64 string. Generate with:
 *   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
 *
 * Future key rotation: the format will be extended to `v1:iv.tag.ciphertext`
 * so v2+ can branch on the prefix. v1 is implicit today.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM standard.
const TAG_LEN = 16;
const KEY_LEN = 32;

function decodeKey(keyB64: string): Buffer {
  const buf = Buffer.from(keyB64, 'base64');
  if (buf.length !== KEY_LEN) {
    throw new Error(
      `symmetric: key must be ${KEY_LEN} bytes (base64-encoded); got ${buf.length}`,
    );
  }
  return buf;
}

export function encrypt(plaintext: string, keyB64: string): string {
  const key = decodeKey(keyB64);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decrypt(ciphertext: string, keyB64: string): string {
  const key = decodeKey(keyB64);
  const parts = ciphertext.split('.');
  if (parts.length !== 3) {
    throw new Error('symmetric: malformed ciphertext (expected `iv.tag.body`)');
  }
  const [ivB64, tagB64, bodyB64] = parts;
  const iv = Buffer.from(ivB64!, 'base64');
  const tag = Buffer.from(tagB64!, 'base64');
  const body = Buffer.from(bodyB64!, 'base64');
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error('symmetric: malformed ciphertext segment lengths');
  }
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(body), decipher.final()]);
  return dec.toString('utf8');
}
