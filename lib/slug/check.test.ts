import { describe, expect, it } from 'vitest';
import { checkSlugAvailability, type SlugCheckDeps } from './check';

const noProfile: SlugCheckDeps['findProfileBySlug'] = async () => null;
const noReservation: SlugCheckDeps['findReservation'] = async () => null;

const baseDeps: SlugCheckDeps = {
  findProfileBySlug: noProfile,
  findReservation: noReservation,
};

describe('checkSlugAvailability', () => {
  it('reports available for a clean, free slug', async () => {
    const r = await checkSlugAvailability({ slug: 'clean-name' }, baseDeps);
    expect(r).toEqual({ available: true });
  });

  it('rejects format failures before touching the DB', async () => {
    const r = await checkSlugAvailability({ slug: 'a' }, baseDeps);
    expect(r).toEqual({ available: false, reason: 'too-short' });
  });

  it('rejects profanity', async () => {
    const r = await checkSlugAvailability({ slug: 'fuck-this' }, baseDeps);
    expect(r).toEqual({ available: false, reason: 'profane' });
  });

  it('rejects reserved words', async () => {
    const deps: SlugCheckDeps = {
      ...baseDeps,
      findReservation: async (slug) =>
        slug === 'admin'
          ? { type: 'reserved', held_by_user_id: null, expires_at: null }
          : null,
    };
    const r = await checkSlugAvailability({ slug: 'admin' }, deps);
    expect(r).toEqual({ available: false, reason: 'reserved' });
  });

  it('rejects when an active soft_hold belongs to another user', async () => {
    const deps: SlugCheckDeps = {
      ...baseDeps,
      findReservation: async () => ({
        type: 'soft_hold',
        held_by_user_id: 'someone-else',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    };
    const r = await checkSlugAvailability(
      { slug: 'taken', requestingUserId: 'me' },
      deps,
    );
    expect(r).toEqual({ available: false, reason: 'taken' });
  });

  it('treats expired soft_hold as available', async () => {
    const deps: SlugCheckDeps = {
      ...baseDeps,
      findReservation: async () => ({
        type: 'soft_hold',
        held_by_user_id: 'someone-else',
        expires_at: new Date(Date.now() - 60_000).toISOString(),
      }),
    };
    const r = await checkSlugAvailability({ slug: 'old-hold' }, deps);
    expect(r).toEqual({ available: true });
  });

  it("treats current user's own soft_hold as available", async () => {
    const deps: SlugCheckDeps = {
      ...baseDeps,
      findReservation: async () => ({
        type: 'soft_hold',
        held_by_user_id: 'me',
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    };
    const r = await checkSlugAvailability(
      { slug: 'my-own-hold', requestingUserId: 'me' },
      deps,
    );
    expect(r).toEqual({ available: true });
  });

  it('rejects when an existing profile owns the slug', async () => {
    const deps: SlugCheckDeps = {
      ...baseDeps,
      findProfileBySlug: async (slug) =>
        slug === 'taken-by-profile' ? { id: 'p1' } : null,
    };
    const r = await checkSlugAvailability({ slug: 'taken-by-profile' }, deps);
    expect(r).toEqual({ available: false, reason: 'taken' });
  });
});
