import { fireEvent, screen } from '@testing-library/react';
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
  overrides: Partial<{ pressKitUrl: string; pressKitProvider: string; slug: string }>,
): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: overrides.slug ?? 'mariana-luz',
      status: 'draft',
      defaultLocale: 'pt-BR',
      pressKitUrl: overrides.pressKitUrl,
      pressKitProvider: overrides.pressKitProvider,
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('PressKitLinkRender', () => {
  it('renders nothing when there is no URL', async () => {
    const { container } = await renderAsync(
      PressKitLinkRender({ bundle: makeBundle({}) }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the CTA with target=_blank and a safe rel', async () => {
    await renderAsync(
      PressKitLinkRender({
        bundle: makeBundle({
          pressKitUrl: 'https://drive.google.com/file/d/abc/view',
          pressKitProvider: 'google-drive',
        }),
      }),
    );
    const link = screen.getByRole('link', { name: /download press kit/i });
    expect(link).toHaveAttribute('href', 'https://drive.google.com/file/d/abc/view');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each([
    ['google-drive', /hosted on google drive/i],
    ['dropbox', /hosted on dropbox/i],
    ['notion', /hosted on notion/i],
    ['mediafire', /hosted on mediafire/i],
  ] as const)('shows the %s badge', async (provider, label) => {
    await renderAsync(
      PressKitLinkRender({
        bundle: makeBundle({
          pressKitUrl: 'https://example.com/kit',
          pressKitProvider: provider,
        }),
      }),
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('omits the badge for "other" provider', async () => {
    await renderAsync(
      PressKitLinkRender({
        bundle: makeBundle({
          pressKitUrl: 'https://example.com/kit',
          pressKitProvider: 'other',
        }),
      }),
    );
    expect(screen.queryByText(/hosted on/i)).toBeNull();
  });

  it('fires press_kit_click on click with provider + slug', async () => {
    await renderAsync(
      PressKitLinkRender({
        bundle: makeBundle({
          pressKitUrl: 'https://www.dropbox.com/scl/fi/abc/kit.zip',
          pressKitProvider: 'dropbox',
          slug: 'mariana-luz',
        }),
      }),
    );
    fireEvent.click(screen.getByRole('link', { name: /download press kit/i }));
    expect(track.track).toHaveBeenCalledWith('press_kit_click', {
      provider: 'dropbox',
      profileSlug: 'mariana-luz',
    });
  });
});
