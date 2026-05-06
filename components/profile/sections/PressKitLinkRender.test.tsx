import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

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
  it('renders nothing when there is no URL', () => {
    const { container } = render(
      <PressKitLinkRender bundle={makeBundle({})} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the CTA with target=_blank and a safe rel', () => {
    render(
      <PressKitLinkRender
        bundle={makeBundle({
          pressKitUrl: 'https://drive.google.com/file/d/abc/view',
          pressKitProvider: 'google-drive',
        })}
      />,
    );
    const link = screen.getByRole('link', { name: /baixar press kit/i });
    expect(link).toHaveAttribute('href', 'https://drive.google.com/file/d/abc/view');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each([
    ['google-drive', /hospedado no google drive/i],
    ['dropbox', /hospedado no dropbox/i],
    ['notion', /hospedado no notion/i],
    ['mediafire', /hospedado no mediafire/i],
  ] as const)('shows the %s badge', (provider, label) => {
    render(
      <PressKitLinkRender
        bundle={makeBundle({
          pressKitUrl: 'https://example.com/kit',
          pressKitProvider: provider,
        })}
      />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('omits the badge for "other" provider', () => {
    render(
      <PressKitLinkRender
        bundle={makeBundle({
          pressKitUrl: 'https://example.com/kit',
          pressKitProvider: 'other',
        })}
      />,
    );
    expect(screen.queryByText(/hospedado/i)).toBeNull();
  });

  it('fires press_kit_click on click with provider + slug', () => {
    render(
      <PressKitLinkRender
        bundle={makeBundle({
          pressKitUrl: 'https://www.dropbox.com/scl/fi/abc/kit.zip',
          pressKitProvider: 'dropbox',
          slug: 'mariana-luz',
        })}
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: /baixar press kit/i }));
    expect(track.track).toHaveBeenCalledWith('press_kit_click', {
      provider: 'dropbox',
      profileSlug: 'mariana-luz',
    });
  });
});
