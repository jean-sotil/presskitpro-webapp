import { describe, expect, it } from 'vitest';

import {
  decideSoftDelete,
  normalizeEmailForConfirm,
} from './soft-delete';

describe('normalizeEmailForConfirm', () => {
  it('lowercases and trims for case-insensitive comparison', () => {
    expect(normalizeEmailForConfirm('  Foo@Bar.COM ')).toBe('foo@bar.com');
    expect(normalizeEmailForConfirm('foo@bar.com')).toBe('foo@bar.com');
  });

  it('returns empty string for null/undefined input', () => {
    expect(normalizeEmailForConfirm(null)).toBe('');
    expect(normalizeEmailForConfirm(undefined)).toBe('');
  });
});

describe('decideSoftDelete', () => {
  const NOW = new Date('2026-05-07T00:00:00Z');

  it('refuses when the user is missing', () => {
    expect(
      decideSoftDelete({
        user: null,
        confirmEmail: 'foo@bar.com',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'user-not-found' });
  });

  it('refuses when the typed email does not match', () => {
    expect(
      decideSoftDelete({
        user: { id: 1, email: 'real@dj.com', deletionRequestedAt: null },
        confirmEmail: 'wrong@dj.com',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'email-mismatch' });
  });

  it('accepts a case-insensitive whitespace-padded match', () => {
    expect(
      decideSoftDelete({
        user: { id: 1, email: 'real@dj.com', deletionRequestedAt: null },
        confirmEmail: '  Real@DJ.COM  ',
        now: NOW,
      }),
    ).toEqual({
      ok: true,
      patch: { deletionRequestedAt: NOW.toISOString() },
      alreadyMarked: false,
    });
  });

  it('is idempotent — re-confirming on a soft-deleted account is a no-op', () => {
    const result = decideSoftDelete({
      user: {
        id: 1,
        email: 'real@dj.com',
        deletionRequestedAt: '2026-05-01T00:00:00Z',
      },
      confirmEmail: 'real@dj.com',
      now: NOW,
    });
    expect(result).toEqual({
      ok: true,
      patch: {},
      alreadyMarked: true,
    });
  });

  it('refuses when the user has no email on file', () => {
    expect(
      decideSoftDelete({
        user: { id: 1, email: null, deletionRequestedAt: null },
        confirmEmail: 'anything@x.com',
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: 'user-not-found' });
  });
});
