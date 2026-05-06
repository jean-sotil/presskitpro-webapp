import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ServicesEditCard } from './ServicesEditCard';

function makeBundle(services: Array<{ title: string; description?: string }> = []): EditorBundle {
  return {
    profile: { id: 1, owner: 1, slug: 'a', status: 'draft', defaultLocale: 'pt-BR' },
    content: services.length
      ? ({ id: 9, profile: 1, services } as never)
      : null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('ServicesEditCard', () => {
  it('shows the empty-state hint when no services exist', () => {
    render(<ServicesEditCard bundle={makeBundle()} onMutate={vi.fn()} />);
    expect(screen.getByText(/nenhum serviço cadastrado/i)).toBeInTheDocument();
  });

  it('renders one row per service + drag handle + remove button', () => {
    render(
      <ServicesEditCard
        bundle={makeBundle([
          { title: 'DJ Set', description: '60 min' },
          { title: 'Produção' },
        ])}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getAllByLabelText(/reordenar serviço/i)).toHaveLength(2);
    expect(screen.getAllByLabelText(/remover serviço/i)).toHaveLength(2);
  });

  it('flags an empty title with role="alert"', () => {
    render(
      <ServicesEditCard
        bundle={makeBundle([{ title: '' }])}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/título é obrigatório/i);
  });

  it('fires onMutate with the patched array on title edit', () => {
    const onMutate = vi.fn();
    render(
      <ServicesEditCard
        bundle={makeBundle([{ title: 'OK' }])}
        onMutate={onMutate}
      />,
    );
    const input = screen.getByPlaceholderText(/título do serviço/i);
    fireEvent.change(input, { target: { value: 'DJ Set' } });
    expect(onMutate).toHaveBeenCalledWith('content', {
      services: [{ title: 'DJ Set' }],
    });
  });

  it('add button is disabled at MAX_SERVICES', () => {
    render(
      <ServicesEditCard
        bundle={makeBundle(
          Array.from({ length: 8 }, (_, i) => ({ title: `S${i}` })),
        )}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /\+ adicionar serviço/i })).toBeDisabled();
    expect(screen.getByText(/máximo 8 serviços/i)).toBeInTheDocument();
  });

  it('remove drops the row from the array', () => {
    const onMutate = vi.fn();
    render(
      <ServicesEditCard
        bundle={makeBundle([{ title: 'A' }, { title: 'B' }])}
        onMutate={onMutate}
      />,
    );
    fireEvent.click(screen.getAllByLabelText(/remover serviço/i)[1]!);
    expect(onMutate).toHaveBeenCalledWith('content', {
      services: [{ title: 'A' }],
    });
  });
});
