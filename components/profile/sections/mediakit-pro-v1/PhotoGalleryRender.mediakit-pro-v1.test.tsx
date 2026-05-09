import { screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { PhotoGalleryMediakitProV1 } from './PhotoGalleryRender.mediakit-pro-v1';

// `mediaUrl()` returns null without NEXT_PUBLIC_SUPABASE_URL, which would
// filter every gallery item to nothing and short-circuit the section.
const ORIGINAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
});
afterAll(() => {
  if (ORIGINAL_SUPABASE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_SUPABASE_URL;
  }
});

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
};

function makeBundle(items: GalleryEntry[]): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
      gallery: items as never,
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

const item = (id: number): GalleryEntry => ({
  id,
  bucket: 'media',
  path: `g${id}.jpg`,
  alt: `Photo ${id}`,
});

describe('PhotoGalleryMediakitProV1', () => {
  it('returns null when there are no items', async () => {
    const { container } = await renderAsync(
      PhotoGalleryMediakitProV1({ bundle: makeBundle([]) }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the numbered marker + Live frames heading', async () => {
    await renderAsync(
      PhotoGalleryMediakitProV1({
        bundle: makeBundle([item(1), item(2), item(3)]),
      }),
    );
    expect(screen.getByText(/05 — gallery/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /live frames/i }),
    ).toBeInTheDocument();
  });

  it('emits the section with the galeria id', async () => {
    const { container } = await renderAsync(
      PhotoGalleryMediakitProV1({
        bundle: makeBundle([item(1), item(2), item(3)]),
      }),
    );
    expect(container.querySelector('section#galeria')).not.toBeNull();
  });
});
