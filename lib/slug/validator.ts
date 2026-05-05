/**
 * Slug validation.
 *
 * Two pure functions consumed by `/api/slug/check` and the wizard:
 *   - `validateSlugFormat` — grammar (PRD Appendix A): lowercase + digits +
 *     hyphens, no leading/trailing hyphen, no consecutive hyphens, length 2–30.
 *   - `containsProfanity` — substring match (word-boundary) against bundled
 *     EN + PT lists at `data/profanity-{en,pt}.txt`.
 *
 * Lists are loaded lazily on first call and cached for the process lifetime.
 */
import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ValidationReason =
  | 'too-short'
  | 'too-long'
  | 'invalid-chars';

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: ValidationReason };

const MIN_LEN = 2;
const MAX_LEN = 30;
// Allowed: lowercase + digits + single hyphens, never at the edges, never doubled.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;

export function validateSlugFormat(input: string): ValidationResult {
  if (input.length < MIN_LEN) return { ok: false, reason: 'too-short' };
  if (input.length > MAX_LEN) return { ok: false, reason: 'too-long' };
  if (!SLUG_RE.test(input)) return { ok: false, reason: 'invalid-chars' };
  if (input.includes('--')) return { ok: false, reason: 'invalid-chars' };
  return { ok: true };
}

// ---------- profanity ----------------------------------------------------

let cachedRegex: RegExp | null = null;

function loadList(): string[] {
  // Repo-relative paths are stable in dev + production builds because Next
  // bundles `data/` as a static asset that's resolvable from the cwd.
  const root = process.cwd();
  const en = readFileSync(join(root, 'data', 'profanity-en.txt'), 'utf8');
  const pt = readFileSync(join(root, 'data', 'profanity-pt.txt'), 'utf8');
  return (en + '\n' + pt)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function getProfanityRegex(): RegExp {
  if (cachedRegex) return cachedRegex;
  const words = loadList();
  // Word-boundary match against the (lowercased) slug. Hyphens act as
  // boundaries inside slug strings since `\b` triggers on the alpha→hyphen
  // transition.
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  cachedRegex = new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
  return cachedRegex;
}

export function containsProfanity(slug: string): boolean {
  return getProfanityRegex().test(slug.toLowerCase());
}

// Test-only — lets unit tests reset the cache between runs if needed.
export function _resetProfanityCache(): void {
  cachedRegex = null;
}
