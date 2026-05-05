import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { SocialLinksEditCard } from './SocialLinksEditCard';

function makeBundle(
  links: Array<{ id: number; platform: string; url: string; displayOrder?: number }> = [],
): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: null,
    theme: null,
    socialLinks: links.map((l, i) => ({
      id: l.id,
      profile: 1,
      platform: l.platform,
      url: l.url,
      displayOrder: l.displayOrder ?? i,
    })) as never,
    featuredTrack: null,
    instagramConnection: null,
  };
}

describe('SocialLinksEditCard', () => {
  it('shows the empty-state when no links', () => {
    render(
      <SocialLinksEditCard bundle={makeBundle()} onMutate={vi.fn()} />,
    );
    expect(screen.getByText(/nenhum link cadastrado/i)).toBeInTheDocument();
  });

  it('renders one row per link with the canonical URL', () => {
    render(
      <SocialLinksEditCard
        bundle={makeBundle([
          { id: 1, platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
          { id: 2, platform: 'whatsapp', url: 'https://wa.me/5511999999999' },
        ])}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByDisplayValue('https://www.instagram.com/dj_x')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://wa.me/5511999999999')).toBeInTheDocument();
  });

  it('adds a blank row on "Adicionar link" and forwards the patch', () => {
    const onMutate = vi.fn();
    render(<SocialLinksEditCard bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.click(screen.getByRole('button', { name: /adicionar link/i }));
    expect(onMutate).toHaveBeenCalledWith('socialLinks', {
      links: [{ platform: 'instagram', url: '' }],
    });
  });

  it('disables "Adicionar link" at the cap of 10', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      platform: 'instagram',
      url: `https://www.instagram.com/dj_${i}`,
    }));
    render(
      <SocialLinksEditCard bundle={makeBundle(items)} onMutate={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /adicionar link/i })).toBeDisabled();
  });

  it('flags an invalid URL with aria-invalid + helper link', () => {
    render(
      <SocialLinksEditCard
        bundle={makeBundle([
          { id: 1, platform: 'whatsapp', url: 'not-a-number' },
        ])}
        onMutate={vi.fn()}
      />,
    );
    const row = screen.getAllByRole('listitem')[0]!;
    const input = within(row).getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(within(row).getByText(/como encontrar a url/i)).toBeInTheDocument();
  });

  it('removes a row and forwards the resulting list', () => {
    const onMutate = vi.fn();
    render(
      <SocialLinksEditCard
        bundle={makeBundle([
          { id: 1, platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
          { id: 2, platform: 'whatsapp', url: 'https://wa.me/5511999999999' },
        ])}
        onMutate={onMutate}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /remover link/i })[0]!);
    expect(onMutate).toHaveBeenCalledWith('socialLinks', {
      links: [
        {
          id: 2,
          platform: 'whatsapp',
          url: 'https://wa.me/5511999999999',
        },
      ],
    });
  });

  it('blocks "Adicionar link" when an existing row is invalid', () => {
    render(
      <SocialLinksEditCard
        bundle={makeBundle([
          { id: 1, platform: 'whatsapp', url: 'not-a-number' },
        ])}
        onMutate={vi.fn()}
      />,
    );
    const banners = screen.getAllByRole('alert');
    expect(banners[0]).toHaveTextContent(/algumas linhas/i);
  });
});
