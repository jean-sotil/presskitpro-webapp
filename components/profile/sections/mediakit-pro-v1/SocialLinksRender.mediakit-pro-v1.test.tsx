import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { SocialLinksMediakitProV1 } from './SocialLinksRender.mediakit-pro-v1';

function makeBundle(links: EditorBundle['socialLinks']): EditorBundle {
  return {
    profile: { id: 1, owner: 1, slug: 'a', status: 'draft', defaultLocale: 'pt-BR' } as never,
    content: null,
    theme: null,
    socialLinks: links,
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('SocialLinksMediakitProV1', () => {
  it('renders the Follow heading + numbered Social media marker', async () => {
    await renderAsync(
      SocialLinksMediakitProV1({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'instagram', url: 'https://www.instagram.com/x' },
        ]),
      }),
    );
    expect(
      screen.getByRole('heading', { level: 2, name: /follow/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/02 — social media/i)).toBeInTheDocument();
  });

  it('renders an inline SVG icon next to each link label', async () => {
    await renderAsync(
      SocialLinksMediakitProV1({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'instagram', url: 'https://www.instagram.com/x' },
          { id: 2, profile: 1, platform: 'youtube', url: 'https://youtube.com/@x' },
        ]),
      }),
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('returns null when there are no links', async () => {
    const { container } = await renderAsync(
      SocialLinksMediakitProV1({ bundle: makeBundle([]) }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
