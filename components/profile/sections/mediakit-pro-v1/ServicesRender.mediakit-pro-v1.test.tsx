import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { ServicesMediakitProV1 } from './ServicesRender.mediakit-pro-v1';

function makeBundle(services: Array<{ title: string; description?: string }>): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: { services } as never,
    theme: {
      id: 1,
      profile: 1,
      presetId: 'mediakit-pro-v1',
      sectionOrder: [{ key: 'services' }],
    },
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('ServicesMediakitProV1', () => {
  it('returns null when there are no services', async () => {
    const { container } = await renderAsync(
      ServicesMediakitProV1({ bundle: makeBundle([]) }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the numbered marker + What you get heading', async () => {
    await renderAsync(
      ProfileRenderer({
        bundle: makeBundle([
          { title: 'Club set', description: 'Two-hour underground set.' },
        ]),
        mode: 'preview',
      }),
    );
    expect(
      screen.getByRole('heading', { level: 2, name: /what you get/i }),
    ).toBeInTheDocument();
  });

  it('renders one card per service with zero-padded index + title + description', async () => {
    await renderAsync(
      ProfileRenderer({
        bundle: makeBundle([
          { title: 'Club set', description: 'Two-hour set.' },
          { title: 'Festival headline', description: 'Main-stage 90 minutes.' },
          { title: 'B2B', description: 'Back-to-back with peers.' },
        ]),
        mode: 'preview',
      }),
    );
    const cards = screen.getAllByRole('heading', { level: 3 });
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent(/club set/i);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText(/two-hour set/i)).toBeInTheDocument();
  });

  it('shows the total set count badge in the header on desktop', async () => {
    await renderAsync(
      ProfileRenderer({
        bundle: makeBundle([
          { title: 'a' },
          { title: 'b' },
          { title: 'c' },
          { title: 'd' },
          { title: 'e' },
        ]),
        mode: 'preview',
      }),
    );
    expect(screen.getByText(/05 sets/i)).toBeInTheDocument();
  });
});
