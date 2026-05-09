import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { AboutMediakitProV1 } from './AboutRender.mediakit-pro-v1';

function makeBundle(content: { tagline?: string; bio?: unknown } = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: content as never,
    theme: {
      id: 1,
      profile: 1,
      presetId: 'mediakit-pro-v1',
      sectionOrder: [{ key: 'about' }],
    },
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('AboutMediakitProV1', () => {
  it('returns null when there is no tagline and no bio', async () => {
    const { container } = await renderAsync(
      AboutMediakitProV1({ bundle: makeBundle() }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the numbered marker + Biography heading', async () => {
    await renderAsync(
      ProfileRenderer({
        bundle: makeBundle({ tagline: 'Producing techno since 2014.' }),
        mode: 'preview',
      }),
    );
    expect(screen.getByText(/biography/i)).toBeInTheDocument();
  });

  it('renders the tagline as the lead paragraph', async () => {
    await renderAsync(
      ProfileRenderer({
        bundle: makeBundle({ tagline: 'Producing techno since 2014.' }),
        mode: 'preview',
      }),
    );
    expect(screen.getByText(/producing techno since 2014/i)).toBeInTheDocument();
  });
});
