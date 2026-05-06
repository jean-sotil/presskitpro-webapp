import { createHash } from 'node:crypto';

/**
 * Cookie-less unique-visitor identifier (PRD §15).
 *
 * SHA-256(salt ‖ ip ‖ ua) truncated to 16 bytes (32 hex chars). The salt
 * rotates daily — see `analytics_salts`. Knowing yesterday's hash tells
 * you nothing about today's, so the same visitor is uncorrelatable
 * across UTC dates.
 *
 * Pure (no env / no I/O) so the route layer can inject the salt.
 */
export function hashVisitor(args: {
  ip: string;
  userAgent: string | undefined;
  salt: Buffer;
}): string {
  if (args.salt.length === 0) {
    throw new Error('hashVisitor: salt must be non-empty');
  }
  const ua = args.userAgent ?? '';
  const h = createHash('sha256');
  h.update(args.salt);
  h.update('|');
  h.update(args.ip);
  h.update('|');
  h.update(ua);
  return h.digest('hex').slice(0, 32); // 16 bytes
}
