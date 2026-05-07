/**
 * HMAC-signed "keep my slug" token (task-32).
 *
 * Embedded in the Day-23 warning email so the artist can save their
 * slug with one click and no login. The token format is
 * `<payload>.<signature>` where payload is `<profileId>:<warningAt>`
 * base64url-encoded; signature is HMAC-SHA256 base64url.
 *
 * Built-in expiry isn't necessary because the route also checks that
 * `Profile.slugReclaimWarningAt === warningAt` — once the cron sends a
 * fresh warning, the old token's `warningAt` no longer matches and
 * verification fails at the database boundary.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const ALGO = 'sha256';

export type SignArgs = {
  profileId: number | string;
  warningAt: string;
};

export type VerifyResult =
  | { ok: true; profileId: string; warningAt: string }
  | { ok: false; reason: 'malformed' | 'invalid-signature' };

export function signKeepSlugToken(args: SignArgs): string {
  const secret = readSecret();
  const payload = `${args.profileId}:${args.warningAt}`;
  const payloadB64 = base64url(Buffer.from(payload, 'utf8'));
  const sig = createHmac(ALGO, secret).update(payload, 'utf8').digest();
  const sigB64 = base64url(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyKeepSlugToken(token: string): VerifyResult {
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'malformed' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payloadB64, sigB64] = parts as [string, string];
  let payloadBytes: Buffer;
  let sigBytes: Buffer;
  try {
    payloadBytes = base64urlDecode(payloadB64);
    sigBytes = base64urlDecode(sigB64);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const payload = payloadBytes.toString('utf8');
  const colonIdx = payload.indexOf(':');
  if (colonIdx === -1) return { ok: false, reason: 'malformed' };

  let secret: string;
  try {
    secret = readSecret();
  } catch {
    return { ok: false, reason: 'invalid-signature' };
  }
  const expectedSig = createHmac(ALGO, secret).update(payload, 'utf8').digest();

  if (
    expectedSig.length !== sigBytes.length ||
    !timingSafeEqual(expectedSig, sigBytes)
  ) {
    return { ok: false, reason: 'invalid-signature' };
  }

  return {
    ok: true,
    profileId: payload.slice(0, colonIdx),
    warningAt: payload.slice(colonIdx + 1),
  };
}

function readSecret(): string {
  const s = process.env.KEEP_SLUG_TOKEN_SECRET;
  if (!s) {
    throw new Error(
      'KEEP_SLUG_TOKEN_SECRET is required to sign/verify slug-reclaim tokens. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  return s;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Buffer {
  let padded = s.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4 !== 0) padded += '=';
  return Buffer.from(padded, 'base64');
}
