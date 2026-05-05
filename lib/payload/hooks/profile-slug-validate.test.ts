import { describe, expect, it } from 'vitest';

import { validateProfileSlug } from './profile-slug-validate';

describe('validateProfileSlug', () => {
  it('returns true for a valid slug', () => {
    expect(validateProfileSlug('dj-mariana')).toBe(true);
  });

  it('rejects slugs that fail the format check (too-short)', () => {
    const result = validateProfileSlug('a');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/too-short/);
  });

  it('rejects slugs with invalid chars', () => {
    expect(validateProfileSlug('Bad Slug!')).toMatch(/invalid-chars/);
  });

  it('returns true when the value is undefined (Payload checks `required` separately)', () => {
    expect(validateProfileSlug(undefined as unknown as string)).toBe(true);
  });

  it('returns true when the value is not a string (defers to type validation)', () => {
    expect(validateProfileSlug(123 as unknown as string)).toBe(true);
  });
});
