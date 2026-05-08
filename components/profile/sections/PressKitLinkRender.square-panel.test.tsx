import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import * as track from '@/lib/analytics/track';
import { PressKitLinkRender } from './PressKitLinkRender';

beforeEach(() => {
  vi.spyOn(track, 'track').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

function makeBundle(
  overrides: Partial<{ pressKitUrl: string; pressKitProvider: string; pressKitHealthStatus: string }>,
): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'hayakawa',
      status: 'draft',
      defaultLocale: 'pt-BR',
      pressKitUrl: overrides.pressKitUrl,
      pressKitProvider: overrides.pressKitProvider,
      pressKitHealthStatus: overrides.pressKitHealthStatus,
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('PressKitLinkRender variant=square-panel', () => {
  it('renders the Download press kit heading + CTA', async () => {
    await renderAsync(
      PressKitLinkRender({
        variant: 'square-panel',
        bundle: makeBundle({
          pressKitUrl: 'https://drive.google.com/file/d/abc/view',
          pressKitProvider: 'google-drive',
        }),
      }),
    );
    expect(
      screen.getByRole('heading', { level: 2, name: /download[\s\S]*press[\s\S]*kit/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute(
      'href',
      'https://drive.google.com/file/d/abc/view',
    );
  });

  it('renders the inline motif SVG', async () => {
    const { container } = await renderAsync(
      PressKitLinkRender({
        variant: 'square-panel',
        bundle: makeBundle({
          pressKitUrl: 'https://example.com/kit.zip',
          pressKitProvider: 'other',
        }),
      }),
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('returns null when health=broken', async () => {
    const { container } = await renderAsync(
      PressKitLinkRender({
        variant: 'square-panel',
        bundle: makeBundle({
          pressKitUrl: 'https://example.com/kit.zip',
          pressKitProvider: 'other',
          pressKitHealthStatus: 'broken',
        }),
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when there is no URL', async () => {
    const { container } = await renderAsync(
      PressKitLinkRender({ variant: 'square-panel', bundle: makeBundle({}) }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
