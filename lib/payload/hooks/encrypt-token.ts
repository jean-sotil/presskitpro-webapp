import { decrypt, encrypt } from '../../crypto/symmetric';

/**
 * Field-level beforeChange/afterRead pair for `InstagramConnections.accessToken`.
 *
 * The plaintext token is never stored: beforeChange replaces it with the
 * `iv.tag.ciphertext` envelope; afterRead decrypts on read. Idempotent on
 * update — a value that already looks like a v1 ciphertext is passed through
 * unchanged so re-saving a doc doesn't double-encrypt.
 *
 * The encryption key is read lazily (on the first hook call) from
 * `INSTAGRAM_TOKEN_ENCRYPTION_KEY` so module-load doesn't require the env
 * var (tests + offline builds work).
 */

const CIPHERTEXT_RE = /^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/;

function readKey(): string {
  const key = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'INSTAGRAM_TOKEN_ENCRYPTION_KEY is required to encrypt IG access tokens. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  return key;
}

function looksLikeCiphertext(value: string): boolean {
  return CIPHERTEXT_RE.test(value);
}

export type BeforeChangeArgs = {
  value: unknown;
  operation: 'create' | 'update' | 'delete';
};

export function encryptTokenBeforeChange(args: BeforeChangeArgs): string | undefined {
  if (typeof args.value !== 'string' || args.value.length === 0) return undefined;
  if (looksLikeCiphertext(args.value)) return args.value;
  return encrypt(args.value, readKey());
}

export type AfterReadArgs = { value: unknown };

export function decryptTokenAfterRead(args: AfterReadArgs): string | undefined {
  if (typeof args.value !== 'string' || args.value.length === 0) return undefined;
  if (!looksLikeCiphertext(args.value)) return args.value;
  return decrypt(args.value, readKey());
}
