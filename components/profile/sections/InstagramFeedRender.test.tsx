import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { InstagramFeedRender } from './InstagramFeedRender';

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function makeBundle(
  posts: Array<{
    id: number;
    url?: string;
    oembedHtml?: string | null;
    displayOrder?: number;
  }>,
): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: posts.map((p, i) => ({
      id: p.id,
      profile: 1,
      url: p.url ?? 'https://www.instagram.com/p/abc/',
      oembedHtml: p.oembedHtml ?? null,
      displayOrder: p.displayOrder ?? i,
    })) as never,
  };
}

describe('InstagramFeedRender', () => {
  it('renders nothing when there are no posts', () => {
    const { container } = render(<InstagramFeedRender bundle={makeBundle([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one card per post in displayOrder', () => {
    const { container } = render(
      <InstagramFeedRender
        bundle={makeBundle([
          {
            id: 1,
            oembedHtml: '<blockquote class="instagram-media">A</blockquote>',
            displayOrder: 1,
          },
          {
            id: 2,
            oembedHtml: '<blockquote class="instagram-media">B</blockquote>',
            displayOrder: 0,
          },
        ])}
      />,
    );
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain('B');
    expect(items[1]?.textContent).toContain('A');
  });

  it('skips posts that have no oembedHtml', () => {
    const { container } = render(
      <InstagramFeedRender
        bundle={makeBundle([
          { id: 1, oembedHtml: '<blockquote>A</blockquote>' },
          { id: 2, oembedHtml: null },
        ])}
      />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });
});
