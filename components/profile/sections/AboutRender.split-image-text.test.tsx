import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { AboutRender } from './AboutRender';

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
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('AboutRender variant=split-image-text', () => {
  it('returns null when there is no tagline and no bio', async () => {
    const { container } = await renderAsync(
      AboutRender({ variant: 'split-image-text', bundle: makeBundle() }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the numbered marker + Biography heading', async () => {
    await renderAsync(
      AboutRender({
        variant: 'split-image-text',
        bundle: makeBundle({ tagline: 'Producing techno since 2014.' }),
      }),
    );
    expect(screen.getByText(/01 — about/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /biography/i }),
    ).toBeInTheDocument();
  });

  it('renders the tagline as the lead paragraph', async () => {
    await renderAsync(
      AboutRender({
        variant: 'split-image-text',
        bundle: makeBundle({ tagline: 'Producing techno since 2014.' }),
      }),
    );
    expect(screen.getByText(/producing techno since 2014/i)).toBeInTheDocument();
  });
});
