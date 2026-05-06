import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { buildProfileMetadata } from './build-profile-metadata';

function makeBundle(overrides: {
  profile?: Partial<EditorBundle['profile']>;
  content?: Record<string, unknown> | null;
} = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'mariana-luz',
      status: 'published',
      defaultLocale: 'pt-BR',
      localesAvailable: ['pt-BR'],
      ...overrides.profile,
    } as never,
    content: (overrides.content ?? null) as never,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('buildProfileMetadata', () => {
  it('uses the auto-fallback title when metaTitle is missing', () => {
    const meta = buildProfileMetadata(makeBundle(), 'https://presskit.pro');
    expect(meta.title).toBe('mariana luz — Press Kit & EPK');
  });

  it('uses metaTitle verbatim when present', () => {
    const meta = buildProfileMetadata(
      makeBundle({ content: { metaTitle: 'Custom Title' } }),
      'https://presskit.pro',
    );
    expect(meta.title).toBe('Custom Title');
  });

  it('passes through metaDescription / tagline as description', () => {
    const a = buildProfileMetadata(
      makeBundle({ content: { metaDescription: 'Custom D' } }),
      'https://presskit.pro',
    );
    expect(a.description).toBe('Custom D');
    const b = buildProfileMetadata(
      makeBundle({ content: { tagline: 'Tag line' } }),
      'https://presskit.pro',
    );
    expect(b.description).toBe('Tag line');
  });

  it('builds the canonical URL without a locale prefix', () => {
    const meta = buildProfileMetadata(
      makeBundle({ profile: { localesAvailable: ['pt-BR', 'en'] } }),
      'https://presskit.pro',
    );
    expect(meta.alternates?.canonical).toBe('https://presskit.pro/mariana-luz');
  });

  it('emits one hreflang alternate per locale + x-default', () => {
    const meta = buildProfileMetadata(
      makeBundle({
        profile: {
          defaultLocale: 'pt-BR',
          localesAvailable: ['pt-BR', 'en'],
        },
      }),
      'https://presskit.pro',
    );
    const langs = meta.alternates?.languages ?? {};
    expect(langs['pt-BR']).toBe('https://presskit.pro/mariana-luz');
    expect(langs['en']).toBe('https://presskit.pro/mariana-luz');
    expect(langs['x-default']).toBe('https://presskit.pro/mariana-luz');
  });

  it('returns summary_large_image when an image is available, summary otherwise', () => {
    const withImage = buildProfileMetadata(
      makeBundle(),
      'https://presskit.pro',
      { imageUrl: 'https://abc.supabase.co/portrait.jpg' },
    );
    expect((withImage.twitter as { card?: string } | undefined)?.card).toBe(
      'summary_large_image',
    );
    expect(withImage.openGraph?.images).toEqual([
      { url: 'https://abc.supabase.co/portrait.jpg' },
    ]);

    const sansImage = buildProfileMetadata(makeBundle(), 'https://presskit.pro');
    expect((sansImage.twitter as { card?: string } | undefined)?.card).toBe(
      'summary',
    );
    expect(sansImage.openGraph?.images).toBeUndefined();
  });

  it('always returns the bare slug URL even when locales suggest otherwise', () => {
    const meta = buildProfileMetadata(
      makeBundle({ profile: { localesAvailable: ['en', 'pt-BR'] } }),
      'https://presskit.pro/',
    );
    // Trailing slash on origin shouldn't double up.
    expect(meta.alternates?.canonical).toBe('https://presskit.pro/mariana-luz');
  });
});
