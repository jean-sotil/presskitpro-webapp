import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { buildProfileJsonLd } from './build-profile-jsonld';

function makeBundle(overrides: {
  profile?: Partial<EditorBundle['profile']>;
  content?: Partial<NonNullable<EditorBundle['content']>>;
  socialLinks?: EditorBundle['socialLinks'];
  featuredTrack?: EditorBundle['featuredTrack'];
} = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'mariana-luz',
      status: 'published',
      defaultLocale: 'pt-BR',
      ...overrides.profile,
    } as never,
    content: (overrides.content ?? null) as never,
    theme: null,
    socialLinks: (overrides.socialLinks ?? []) as never,
    featuredTrack: (overrides.featuredTrack ?? null) as never,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('buildProfileJsonLd', () => {
  it('emits a MusicGroup with the artist display name and canonical URL', () => {
    const ld = buildProfileJsonLd(makeBundle(), 'https://presskit.pro');
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('MusicGroup');
    expect(ld.name).toBe('mariana luz');
    expect(ld.url).toBe('https://presskit.pro/mariana-luz');
  });

  it('uses metaTitle and metaDescription when present', () => {
    const ld = buildProfileJsonLd(
      makeBundle({
        content: {
          metaTitle: 'Mariana Luz — DJ',
          metaDescription: 'Brazilian house DJ',
        } as never,
      }),
      'https://presskit.pro',
    );
    expect(ld.name).toBe('Mariana Luz — DJ');
    expect(ld.description).toBe('Brazilian house DJ');
  });

  it('falls back to tagline as description when metaDescription is missing', () => {
    const ld = buildProfileJsonLd(
      makeBundle({ content: { tagline: 'House melódico' } as never }),
      'https://presskit.pro',
    );
    expect(ld.description).toBe('House melódico');
  });

  it('builds sameAs from social links + featured track + press kit, dedup + drop falsy', () => {
    const ld = buildProfileJsonLd(
      makeBundle({
        profile: { pressKitUrl: 'https://drive.google.com/file/d/abc/view' } as never,
        socialLinks: [
          { id: 1, profile: 1, platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
          { id: 2, profile: 1, platform: 'spotify', url: 'https://open.spotify.com/artist/abc' },
          { id: 3, profile: 1, platform: 'instagram', url: '' }, // dropped
          // duplicate of the spotify one above — dedup
          { id: 4, profile: 1, platform: 'spotify', url: 'https://open.spotify.com/artist/abc' },
        ] as never,
        featuredTrack: {
          id: 5,
          profile: 1,
          url: 'https://soundcloud.com/dj_x/track',
        } as never,
      }),
      'https://presskit.pro',
    );
    expect(ld.sameAs).toEqual([
      'https://www.instagram.com/dj_x',
      'https://open.spotify.com/artist/abc',
      'https://soundcloud.com/dj_x/track',
      'https://drive.google.com/file/d/abc/view',
    ]);
  });

  it('omits sameAs when the array would be empty', () => {
    const ld = buildProfileJsonLd(makeBundle(), 'https://presskit.pro');
    expect(ld.sameAs).toBeUndefined();
  });

  it('emits an image when ogImage or portrait is present (mediaUrl resolved by caller)', () => {
    const ld = buildProfileJsonLd(
      makeBundle({
        profile: {
          portrait: { bucket: 'avatars', path: 'sb-1/foo.jpg' },
        } as never,
      }),
      'https://presskit.pro',
      { imageUrl: 'https://abc.supabase.co/storage/v1/object/public/avatars/sb-1/foo.jpg' },
    );
    expect(ld.image).toBe(
      'https://abc.supabase.co/storage/v1/object/public/avatars/sb-1/foo.jpg',
    );
  });
});
