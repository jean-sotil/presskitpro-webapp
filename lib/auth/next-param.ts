/**
 * Validates a `next` redirect target so attackers can't redirect users
 * off-site after auth (open-redirect / phishing).
 *
 * Rules (all must hold for the input to be returned as-is):
 *   1. Non-empty string.
 *   2. Starts with `/`.
 *   3. Does NOT start with `//` (protocol-relative).
 *   4. No control characters or whitespace (header-smuggling defense).
 *   5. Does NOT contain a colon before the first `/` (e.g., `javascript:`).
 *
 * Anything else returns the fallback (default `/dashboard`).
 */
export function safeNext(
  input: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (typeof input !== 'string' || input.length === 0) return fallback;
  if (input[0] !== '/') return fallback;
  if (input.startsWith('//')) return fallback;
  if (/[\s\x00-\x1f]/.test(input)) return fallback;
  // Reject any colon at all — relative paths never need one.
  if (input.includes(':')) return fallback;
  return input;
}
