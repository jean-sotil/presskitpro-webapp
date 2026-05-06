import { describe, expect, it, vi } from 'vitest';

import {
  type BundleDeps,
  loadBundle,
  publishProfile,
  unpublishProfile,
} from './bundle';

const PROFILE = {
  id: 99,
  owner: 42,
  slug: 'mariana-luz',
  status: 'draft' as const,
  defaultLocale: 'pt-BR',
};

const USER = {
  id: 42,
  supabaseUserId: 'sb-1',
  collection: 'users' as const,
} as never;

function makeDeps(overrides: Partial<BundleDeps> = {}): BundleDeps {
  return {
    findProfileById: vi.fn().mockResolvedValue(PROFILE),
    findProfileContent: vi.fn().mockResolvedValue({
      id: 11,
      profile: 99,
      tagline: 'House melódico',
    }),
    findTheme: vi.fn().mockResolvedValue(null),
    findSocialLinks: vi.fn().mockResolvedValue([]),
    findFeaturedTrack: vi.fn().mockResolvedValue(null),
    findInstagramConnection: vi.fn().mockResolvedValue(null),
    findInstagramPosts: vi.fn().mockResolvedValue([]),
    updateProfileStatus: vi.fn().mockResolvedValue({ ...PROFILE, status: 'published' }),
    ...overrides,
  };
}

describe('loadBundle', () => {
  it('returns null when the profile is not found (or access predicate filtered it)', async () => {
    const deps = makeDeps({ findProfileById: vi.fn().mockResolvedValue(null) });
    const result = await loadBundle(deps, { profileId: 99, user: USER });
    expect(result).toBeNull();
  });

  it('composes the 6-collection bundle in parallel after profile is verified', async () => {
    const deps = makeDeps();
    const result = await loadBundle(deps, { profileId: 99, user: USER });
    expect(result).toMatchObject({
      profile: PROFILE,
      content: { tagline: 'House melódico' },
      theme: null,
      socialLinks: [],
      featuredTrack: null,
      instagramConnection: null,
    });
    // Profile lookup happens first (gates everything else); the rest fire in parallel.
    expect(deps.findProfileById).toHaveBeenCalledWith(99, USER);
    expect(deps.findProfileContent).toHaveBeenCalledWith(99, USER);
    expect(deps.findTheme).toHaveBeenCalledWith(99, USER);
    expect(deps.findSocialLinks).toHaveBeenCalledWith(99, USER);
  });
});

describe('publishProfile', () => {
  const FRESH_THEME = {
    id: 12,
    profile: 99,
    contrastValidatedAt: new Date().toISOString(),
  };

  it('refuses with not-found when the user does not own the profile', async () => {
    const deps = makeDeps({ findProfileById: vi.fn().mockResolvedValue(null) });
    const r = await publishProfile(deps, { profileId: 99, user: USER });
    expect(r).toEqual({ ok: false, refusal: { kind: 'not-found' } });
    expect(deps.updateProfileStatus).not.toHaveBeenCalled();
  });

  it('refuses with contrast-stale when the theme has never been validated', async () => {
    const deps = makeDeps({
      findTheme: vi.fn().mockResolvedValue({
        id: 12,
        profile: 99,
        contrastValidatedAt: null,
      }),
    });
    const r = await publishProfile(deps, { profileId: 99, user: USER });
    expect(r).toEqual({
      ok: false,
      refusal: { kind: 'contrast-stale', validatedAt: null },
    });
    expect(deps.updateProfileStatus).not.toHaveBeenCalled();
  });

  it('refuses with contrast-stale when the validation is older than 30 days', async () => {
    const stale = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const deps = makeDeps({
      findTheme: vi.fn().mockResolvedValue({
        id: 12,
        profile: 99,
        contrastValidatedAt: stale,
      }),
    });
    const r = await publishProfile(deps, { profileId: 99, user: USER });
    expect(r).toMatchObject({
      ok: false,
      refusal: { kind: 'contrast-stale', validatedAt: stale },
    });
  });

  it('flips status to published when the theme is fresh', async () => {
    const deps = makeDeps({
      findTheme: vi.fn().mockResolvedValue(FRESH_THEME),
    });
    const r = await publishProfile(deps, { profileId: 99, user: USER });
    expect(deps.updateProfileStatus).toHaveBeenCalledWith({
      profileId: 99,
      status: 'published',
      user: USER,
    });
    expect(r).toEqual({
      ok: true,
      profile: { ...PROFILE, status: 'published' },
      publicPath: '/mariana-luz',
    });
  });
});

describe('unpublishProfile', () => {
  it('flips status to unpublished', async () => {
    const deps = makeDeps({
      updateProfileStatus: vi.fn().mockResolvedValue({ ...PROFILE, status: 'unpublished' }),
    });
    const r = await unpublishProfile(deps, { profileId: 99, user: USER });
    expect(deps.updateProfileStatus).toHaveBeenCalledWith({
      profileId: 99,
      status: 'unpublished',
      user: USER,
    });
    expect(r?.profile.status).toBe('unpublished');
  });
});
