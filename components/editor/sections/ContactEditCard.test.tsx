import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactEditCard } from './ContactEditCard';

function makeBundle(overrides: Record<string, unknown> = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
      contactWhatsapp: '',
      contactEmail: '',
      contactFormEnabled: false,
      contactFormDestination: '',
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

describe('ContactEditCard', () => {
  it('renders empty inputs by default', () => {
    render(<ContactEditCard bundle={makeBundle()} onMutate={vi.fn()} />);
    expect(screen.getByLabelText(/whatsapp/i)).toHaveValue('');
    expect(screen.getByLabelText(/^e-?mail/i)).toHaveValue('');
  });

  it('forwards canonical WhatsApp URL on blur', () => {
    const onMutate = vi.fn();
    render(<ContactEditCard bundle={makeBundle()} onMutate={onMutate} />);
    const input = screen.getByLabelText(/whatsapp/i);
    fireEvent.change(input, { target: { value: '+55 11 99999-9999' } });
    fireEvent.blur(input);
    expect(onMutate).toHaveBeenLastCalledWith('profile', {
      contactWhatsapp: 'https://wa.me/5511999999999',
    });
  });

  it('flags an invalid WhatsApp number with a helper message', () => {
    render(
      <ContactEditCard
        bundle={makeBundle({ contactWhatsapp: 'not-a-number' })}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/whatsapp/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('reveals destination input when the form toggle is enabled', () => {
    const { rerender } = render(
      <ContactEditCard bundle={makeBundle()} onMutate={vi.fn()} />,
    );
    expect(screen.queryByLabelText(/destino das mensagens/i)).toBeNull();
    rerender(
      <ContactEditCard
        bundle={makeBundle({ contactFormEnabled: true })}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/destino das mensagens/i)).toBeInTheDocument();
  });

  it('toggles the contact form on/off via the checkbox', () => {
    const onMutate = vi.fn();
    render(<ContactEditCard bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.click(screen.getByLabelText(/ativar formulário/i));
    expect(onMutate).toHaveBeenLastCalledWith('profile', {
      contactFormEnabled: true,
    });
  });

  it('shows the contact email as the destination fallback hint', () => {
    render(
      <ContactEditCard
        bundle={makeBundle({
          contactEmail: 'artist@example.com',
          contactFormEnabled: true,
        })}
        onMutate={vi.fn()}
      />,
    );
    const dest = screen.getByLabelText(/destino das mensagens/i);
    expect(dest).toHaveAttribute('placeholder', expect.stringMatching(/artist@example\.com/));
  });
});
