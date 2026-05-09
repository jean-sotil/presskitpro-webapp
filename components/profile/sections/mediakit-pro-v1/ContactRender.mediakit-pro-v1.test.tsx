import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { ContactMediakitProV1 } from './ContactRender.mediakit-pro-v1';

function makeBundle(overrides: Record<string, unknown> = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
      ...overrides,
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('ContactMediakitProV1', () => {
  it('renders nothing when no contact data + form disabled', async () => {
    const { container } = await renderAsync(
      ContactMediakitProV1({ bundle: makeBundle() }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the For booking contact heading', async () => {
    await renderAsync(
      ContactMediakitProV1({
        bundle: makeBundle({ contactWhatsapp: '+55 11 99999-9999' }),
      }),
    );
    expect(
      screen.getByRole('heading', { level: 2, name: /for[\s\S]*booking[\s\S]*contact/i }),
    ).toBeInTheDocument();
  });

  it('renders WhatsApp digits + the single CTA pointing at wa.me', async () => {
    await renderAsync(
      ContactMediakitProV1({
        bundle: makeBundle({ contactWhatsapp: '+55 11 99999-9999' }),
      }),
    );
    expect(screen.getByText('+5511999999999')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute(
      'href',
      'https://wa.me/5511999999999',
    );
  });

  it('falls back to email when WhatsApp is missing', async () => {
    await renderAsync(
      ContactMediakitProV1({
        bundle: makeBundle({ contactEmail: 'booking@example.com' }),
      }),
    );
    expect(screen.getByText('booking@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /click here/i })).toHaveAttribute(
      'href',
      'mailto:booking@example.com',
    );
  });
});
