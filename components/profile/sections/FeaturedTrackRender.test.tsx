import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { FeaturedTrackRender } from './FeaturedTrackRender';

beforeEach(() => {
  // Force LazyIframe's fallback path so the iframe mounts immediately.
  vi.stubGlobal('IntersectionObserver', undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function makeBundle(
  overrides: Partial<{ url: string; oembedHtml: string }>,
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
    featuredTrack:
      overrides.url || overrides.oembedHtml
        ? ({
            id: 1,
            profile: 1,
            provider: 'soundcloud',
            url: overrides.url ?? '',
            oembedHtml: overrides.oembedHtml ?? null,
          } as never)
        : null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('FeaturedTrackRender', () => {
  it('renders nothing when there is no track', () => {
    const { container } = render(
      <FeaturedTrackRender bundle={makeBundle({})} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the cached oembedHtml as an iframe (lazy-mounted)', () => {
    render(
      <FeaturedTrackRender
        bundle={makeBundle({
          url: 'https://soundcloud.com/x/y',
          oembedHtml:
            '<iframe src="https://w.soundcloud.com/player/?url=foo" loading="lazy" title="Test"></iframe>',
        })}
      />,
    );
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', expect.stringContaining('w.soundcloud.com'));
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });

  it('falls back to a plain link when oembedHtml is missing', () => {
    render(
      <FeaturedTrackRender
        bundle={makeBundle({ url: 'https://soundcloud.com/x/y' })}
      />,
    );
    const link = screen.getByRole('link', { name: /soundcloud\.com/i });
    expect(link).toHaveAttribute('href', 'https://soundcloud.com/x/y');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(document.querySelector('iframe')).toBeNull();
  });
});
