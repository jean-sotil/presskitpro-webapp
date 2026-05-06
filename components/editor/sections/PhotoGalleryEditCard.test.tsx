import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { PhotoGalleryEditCard } from './PhotoGalleryEditCard';

function withQueryClient(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

function makeBundle(items: Array<Partial<{ id: number; bucket: string; path: string; alt: string; decorative: boolean }>> = []): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
      gallery: items.map((it) => ({
        id: it.id ?? 0,
        bucket: it.bucket ?? 'gallery',
        path: it.path ?? `sb-1/${it.id}.jpg`,
        alt: it.alt ?? '',
        decorative: it.decorative ?? false,
      })),
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('PhotoGalleryEditCard', () => {
  it('shows the empty-state when no items', () => {
    render(
      withQueryClient(
        <PhotoGalleryEditCard
          bundle={makeBundle()}
          supabaseUserId="sb-1"
          onMutate={vi.fn()}
        />,
      ),
    );
    expect(screen.getByText(/arraste ou clique/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('lists the missing-alt indices in a role="alert" banner', () => {
    render(
      withQueryClient(
        <PhotoGalleryEditCard
          bundle={makeBundle([
            { id: 1, alt: 'OK', decorative: false },
            { id: 2, alt: '', decorative: false },
            { id: 3, alt: '', decorative: false },
          ])}
          supabaseUserId="sb-1"
          onMutate={vi.fn()}
        />,
      ),
    );
    const alert = screen.getAllByRole('alert')[0]!;
    expect(alert).toHaveTextContent(/sem texto alternativo/i);
    // Items at positions 2, 3 (1-indexed for users).
    expect(alert).toHaveTextContent(/2, 3/);
  });

  it('shows the soft-cap warning when items > 24', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      alt: `Foto ${i}`,
      decorative: false,
    }));
    render(
      withQueryClient(
        <PhotoGalleryEditCard
          bundle={makeBundle(items)}
          supabaseUserId="sb-1"
          onMutate={vi.fn()}
        />,
      ),
    );
    expect(screen.getByText(/25 fotos/i)).toBeInTheDocument();
    expect(screen.getByText(/galeria pode ficar pesada/i)).toBeInTheDocument();
  });

  it('disables the dropzone at the hard cap', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      alt: `Foto ${i}`,
      decorative: false,
    }));
    render(
      withQueryClient(
        <PhotoGalleryEditCard
          bundle={makeBundle(items)}
          supabaseUserId="sb-1"
          onMutate={vi.fn()}
        />,
      ),
    );
    expect(screen.getByText(/limite atingido/i)).toBeInTheDocument();
  });

  it('reveals bulk delete bar when items are selected', () => {
    render(
      withQueryClient(
        <PhotoGalleryEditCard
          bundle={makeBundle([
            { id: 1, alt: 'a', decorative: false },
            { id: 2, alt: 'b', decorative: false },
          ])}
          supabaseUserId="sb-1"
          onMutate={vi.fn()}
        />,
      ),
    );
    expect(screen.queryByRole('button', { name: /excluir selecionadas/i })).toBeNull();
    fireEvent.click(screen.getByLabelText(/selecionar imagem 1/i));
    expect(screen.getByRole('button', { name: /excluir selecionadas/i })).toBeInTheDocument();
    expect(screen.getByText(/1 selecionada/i)).toBeInTheDocument();
  });
});
