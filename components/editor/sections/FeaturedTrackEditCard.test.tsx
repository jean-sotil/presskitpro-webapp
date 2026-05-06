import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { FeaturedTrackEditCard } from './FeaturedTrackEditCard';

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
  overrides: { url?: string; oembedHtml?: string } = {},
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
    featuredTrack:
      overrides.url || overrides.oembedHtml
        ? ({
            id: 1,
            profile: 42,
            provider: 'soundcloud',
            url: overrides.url ?? '',
            oembedHtml: overrides.oembedHtml ?? null,
          } as never)
        : null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('FeaturedTrackEditCard', () => {
  it('shows the empty-state when no featured track', () => {
    render(withQueryClient(<FeaturedTrackEditCard bundle={makeBundle()} />));
    expect(screen.getByLabelText(/url do soundcloud/i)).toHaveValue('');
    expect(screen.queryByRole('button', { name: /atualizar embed/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /remover/i })).toBeNull();
  });

  it('saves a valid URL via PUT and shows the player preview', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          track: {
            url: 'https://soundcloud.com/artist/track',
            oembedHtml:
              '<iframe src="https://w.soundcloud.com/player/?url=foo" loading="lazy" title="Track"></iframe>',
          },
        }),
        { status: 200 },
      ),
    );
    render(withQueryClient(<FeaturedTrackEditCard bundle={makeBundle()} />));
    fireEvent.change(screen.getByLabelText(/url do soundcloud/i), {
      target: { value: 'https://soundcloud.com/artist/track' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/profiles/42/featured-track',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    expect(
      JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string),
    ).toMatchObject({
      url: 'https://soundcloud.com/artist/track',
      force: false,
    });
    await waitFor(() =>
      expect(
        document.querySelector('iframe[src*="w.soundcloud.com"]'),
      ).toBeInTheDocument(),
    );
  });

  it('surfaces a friendly error when oEmbed fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'oembed-failed', reason: 'not-found' }),
        { status: 502 },
      ),
    );
    render(withQueryClient(<FeaturedTrackEditCard bundle={makeBundle()} />));
    fireEvent.change(screen.getByLabelText(/url do soundcloud/i), {
      target: { value: 'https://soundcloud.com/missing/track' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/não encontramos|404/i),
    );
  });

  it('shows refresh + remove buttons when a track is saved', () => {
    render(
      withQueryClient(
        <FeaturedTrackEditCard
          bundle={makeBundle({
            url: 'https://soundcloud.com/artist/track',
            oembedHtml:
              '<iframe src="https://w.soundcloud.com/player/?url=foo" loading="lazy"></iframe>',
          })}
        />,
      ),
    );
    expect(
      screen.getByRole('button', { name: /atualizar embed/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remover/i })).toBeInTheDocument();
  });

  it('removes the track via DELETE on Remover click', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    render(
      withQueryClient(
        <FeaturedTrackEditCard
          bundle={makeBundle({
            url: 'https://soundcloud.com/artist/track',
            oembedHtml:
              '<iframe src="https://w.soundcloud.com/player/?url=foo" loading="lazy"></iframe>',
          })}
        />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /remover/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/profiles/42/featured-track',
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('forces re-fetch on "Atualizar embed"', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, track: { url: 'x', oembedHtml: '<iframe src="https://w.soundcloud.com/player/?url=foo"></iframe>' } }),
        { status: 200 },
      ),
    );
    render(
      withQueryClient(
        <FeaturedTrackEditCard
          bundle={makeBundle({
            url: 'https://soundcloud.com/artist/track',
            oembedHtml:
              '<iframe src="https://w.soundcloud.com/player/?url=foo" loading="lazy"></iframe>',
          })}
        />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /atualizar embed/i }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/profiles/42/featured-track',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"force":true'),
        }),
      ),
    );
  });
});
