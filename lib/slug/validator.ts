/**
 * Server-only slug validation.
 *
 * The pure format check moved to `./format.ts` so client components
 * (e.g. the wizard's SlugStep) can import it without dragging the
 * `server-only` guard or the profanity-list `fs.readFileSync` into the
 * browser bundle. Server callers (API routes, Payload hooks) keep
 * importing from this module so they get format + profanity in one
 * import.
 *
 * Profanity lists ship at `data/profanity-{en,pt}.txt`; lazy-loaded and
 * cached for the process lifetime.
 */
import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export {
  type ValidationReason,
  type ValidationResult,
  validateSlugFormat,
} from './format';

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
