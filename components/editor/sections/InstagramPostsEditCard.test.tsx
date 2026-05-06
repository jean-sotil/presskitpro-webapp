import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { InstagramPostsEditCard } from './InstagramPostsEditCard';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function withQueryClient(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

function makeBundle(
  posts: Array<{
    id: number;
    url: string;
    oembedHtml?: string;
    fetchedAt?: string;
    displayOrder?: number;
  }> = [],
): EditorBundle {
  return {
    profile: {
      id: 42,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: posts.map((p, i) => ({
      id: p.id,
      profile: 42,
      url: p.url,
      oembedHtml: p.oembedHtml ?? null,
      fetchedAt: p.fetchedAt ?? null,
      displayOrder: p.displayOrder ?? i,
    })) as never,
  };
}

describe('InstagramPostsEditCard', () => {
  it('shows the empty-state when no posts', () => {
    render(withQueryClient(<InstagramPostsEditCard bundle={makeBundle()} />));
    expect(
      screen.getByText(/nenhum post adicionado/i),
    ).toBeInTheDocument();
  });

  it('adds an empty slot on "Adicionar post"', () => {
    render(withQueryClient(<InstagramPostsEditCard bundle={makeBundle()} />));
    fireEvent.click(screen.getByRole('button', { name: /adicionar post/i }));
    // The new row's URL input is present and empty.
    expect(screen.getAllByLabelText(/url do post/i)).toHaveLength(1);
  });

  it('disables "Adicionar post" at 6 slots', () => {
    const posts = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      url: `https://www.instagram.com/p/abc${i}/`,
    }));
    render(withQueryClient(<InstagramPostsEditCard bundle={makeBundle(posts)} />));
    expect(
      screen.getByRole('button', { name: /adicionar post/i }),
    ).toBeDisabled();
  });

  it('saves all slots via PUT and the route returns the persisted list', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            posts: [
              {
                id: 1,
                url: 'https://www.instagram.com/p/abc/',
                oembedHtml: '<blockquote class="instagram-media"></blockquote>',
                fetchedAt: new Date().toISOString(),
                displayOrder: 0,
              },
            ],
          }),
          { status: 200 },
        ),
      );
    render(withQueryClient(<InstagramPostsEditCard bundle={makeBundle()} />));
    fireEvent.click(screen.getByRole('button', { name: /adicionar post/i }));
    fireEvent.change(screen.getByLabelText(/url do post/i), {
      target: { value: 'https://www.instagram.com/p/abc/' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/profiles/42/instagram-posts',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    const sent = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(sent.posts).toEqual([
      { url: 'https://www.instagram.com/p/abc/' },
    ]);
  });

  it('surfaces a friendly error when the route rejects an URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'invalid post', index: 0, reason: 'wrong-host' }),
        { status: 400 },
      ),
    );
    render(withQueryClient(<InstagramPostsEditCard bundle={makeBundle()} />));
    fireEvent.click(screen.getByRole('button', { name: /adicionar post/i }));
    fireEvent.change(screen.getByLabelText(/url do post/i), {
      target: { value: 'https://example.com/p/abc/' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/instagram\.com/i),
    );
  });

  it('flags posts with fetchedAt > 7d as stale', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    render(
      withQueryClient(
        <InstagramPostsEditCard
          bundle={makeBundle([
            {
              id: 1,
              url: 'https://www.instagram.com/p/abc/',
              oembedHtml: '<blockquote></blockquote>',
              fetchedAt: eightDaysAgo,
            },
          ])}
        />,
      ),
    );
    expect(screen.getByText(/recomendado atualizar/i)).toBeInTheDocument();
  });

  it('sends force=true when "Atualizar" is clicked', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, posts: [] }), { status: 200 }),
    );
    render(
      withQueryClient(
        <InstagramPostsEditCard
          bundle={makeBundle([
            {
              id: 1,
              url: 'https://www.instagram.com/p/abc/',
              oembedHtml: '<blockquote></blockquote>',
              fetchedAt: new Date().toISOString(),
            },
          ])}
        />,
      ),
    );
    fireEvent.click(screen.getAllByRole('button', { name: /atualizar/i })[0]!);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/profiles/42/instagram-posts',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"force":true'),
        }),
      ),
    );
  });
});
