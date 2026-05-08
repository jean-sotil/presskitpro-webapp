import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';
import { renderAsync } from '@/tests/helpers/render-async';

import { ContactRender } from './ContactRender';

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

describe('ContactRender', () => {
  it('renders nothing when no contact data + form disabled', async () => {
    const { container } = await renderAsync(ContactRender({ bundle: makeBundle() }));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the WhatsApp button with a wa.me href', async () => {
    await renderAsync(
      ContactRender({
        bundle: makeBundle({ contactWhatsapp: 'https://wa.me/5511999999999' }),
      }),
    );
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/5511999999999',
    );
  });

  it('coerces a bare WhatsApp number into wa.me', async () => {
    await renderAsync(
      ContactRender({ bundle: makeBundle({ contactWhatsapp: '+55 11 99999-9999' }) }),
    );
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/5511999999999',
    );
  });

  it('renders the email button as mailto', async () => {
    await renderAsync(
      ContactRender({ bundle: makeBundle({ contactEmail: 'a@b.com' }) }),
    );
    expect(screen.getByRole('link', { name: /(send email|e-mail)/i })).toHaveAttribute(
      'href',
      'mailto:a@b.com',
    );
  });

  it('renders the form when contactFormEnabled', async () => {
    await renderAsync(
      ContactRender({
        bundle: makeBundle({
          contactWhatsapp: 'https://wa.me/5511999999999',
          contactFormEnabled: true,
        }),
      }),
    );
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeInTheDocument();
  });
});
