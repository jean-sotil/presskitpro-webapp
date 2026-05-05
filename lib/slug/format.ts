/**
 * Pure slug-format validator. No `server-only`, no fs — safe to bundle
 * into client components (the wizard's SlugStep imports this directly so
 * the user gets instant feedback before the debounced API check).
 *
 * Rules per PRD Appendix A: lowercase + digits + single hyphens, never
 * at the edges, never doubled, length 2..30.
 */

export type ValidationReason =
  | 'too-short'
  | 'too-long'
  | 'invalid-chars';

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: ValidationReason };

const MIN_LEN = 2;
const MAX_LEN = 30;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;

export function validateSlugFormat(input: string): ValidationResult {
  if (input.length < MIN_LEN) return { ok: false, reason: 'too-short' };
  if (input.length > MAX_LEN) return { ok: false, reason: 'too-long' };
  if (!SLUG_RE.test(input)) return { ok: false, reason: 'invalid-chars' };
  if (input.includes('--')) return { ok: false, reason: 'invalid-chars' };
  return { ok: true };
}
