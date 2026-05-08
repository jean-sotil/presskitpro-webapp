import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { SocialLinksRender } from './SocialLinksRender';

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

describe('SocialLinksRender', () => {
  it('renders nothing when there are no links', async () => {
    const { container } = await renderAsync(SocialLinksRender({ bundle: makeBundle([]) }));
    expect(container).toBeEmptyDOMElement();
  });

  it('orders by displayOrder ascending', async () => {
    await renderAsync(
      SocialLinksRender({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'whatsapp', url: 'https://wa.me/5511999999999', displayOrder: 1 },
          { id: 2, profile: 1, platform: 'instagram', url: 'https://www.instagram.com/dj_x', displayOrder: 0 },
        ]),
      }),
    );
    const items = screen.getAllByRole('link');
    expect(items[0]).toHaveTextContent(/instagram/i);
    expect(items[1]).toHaveTextContent(/whatsapp/i);
  });

  it('emits mailto: for email and opens in same tab', async () => {
    await renderAsync(
      SocialLinksRender({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'email', url: 'mailto:dj@example.com' },
        ]),
      }),
    );
    const link = screen.getByRole('link', { name: /email/i });
    expect(link).toHaveAttribute('href', 'mailto:dj@example.com');
    expect(link).not.toHaveAttribute('target');
  });

  it('emits wa.me for whatsapp and opens in same tab', async () => {
    await renderAsync(
      SocialLinksRender({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'whatsapp', url: 'https://wa.me/5511999999999' },
        ]),
      }),
    );
    const link = screen.getByRole('link', { name: /whatsapp/i });
    expect(link).toHaveAttribute('href', 'https://wa.me/5511999999999');
    expect(link).not.toHaveAttribute('target');
  });

  it('opens external links in a new tab with safe rel', async () => {
    await renderAsync(
      SocialLinksRender({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
        ]),
      }),
    );
    const link = screen.getByRole('link', { name: /instagram/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('coerces a bare email string into mailto:', async () => {
    await renderAsync(
      SocialLinksRender({
        bundle: makeBundle([
          { id: 1, profile: 1, platform: 'email', url: 'dj@example.com' },
        ]),
      }),
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'mailto:dj@example.com',
    );
  });
});
