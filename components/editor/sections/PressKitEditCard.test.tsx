import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { PressKitEditCard } from './PressKitEditCard';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function makeBundle(
  overrides: Partial<{
    pressKitUrl: string;
    pressKitProvider: string;
  }> = {},
): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
      pressKitUrl: '',
      pressKitProvider: 'unknown',
      ...overrides,
    } as never,
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
  };
}

function mockValidate(body: Record<string, unknown>, status = 200) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe('PressKitEditCard', () => {
  it('renders an empty input when no pressKitUrl is set', () => {
    render(<PressKitEditCard bundle={makeBundle()} onMutate={vi.fn()} />);
    expect(screen.getByLabelText(/url do press kit/i)).toHaveValue('');
  });

  it('validates the URL on Validar click and persists on success', async () => {
    const onMutate = vi.fn();
    mockValidate({ ok: true, provider: 'dropbox', status: 200 });
    render(<PressKitEditCard bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.change(screen.getByLabelText(/url do press kit/i), {
      target: { value: 'https://www.dropbox.com/scl/fi/abc/kit.zip' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));
    await waitFor(() =>
      expect(onMutate).toHaveBeenCalledWith('profile', {
        pressKitUrl: 'https://www.dropbox.com/scl/fi/abc/kit.zip',
      }),
    );
    expect(screen.getByText(/link válido — dropbox/i)).toBeInTheDocument();
  });

  it('does NOT persist a 404 URL — surfaces inline error instead', async () => {
    const onMutate = vi.fn();
    mockValidate({ ok: false, reason: 'not-found', status: 404 });
    render(<PressKitEditCard bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.change(screen.getByLabelText(/url do press kit/i), {
      target: { value: 'https://example.com/missing' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/não encontramos|404/i),
    );
    expect(onMutate).not.toHaveBeenCalled();
  });

  it('persists with a warning chip on Drive restrictive-access', async () => {
    const onMutate = vi.fn();
    mockValidate({
      ok: true,
      provider: 'google-drive',
      status: 200,
      warning: 'restrictive-access',
    });
    render(<PressKitEditCard bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.change(screen.getByLabelText(/url do press kit/i), {
      target: { value: 'https://drive.google.com/file/d/abc/view' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));
    await waitFor(() =>
      expect(screen.getByText(/pode estar restrito/i)).toBeInTheDocument(),
    );
    expect(onMutate).toHaveBeenCalledWith('profile', {
      pressKitUrl: 'https://drive.google.com/file/d/abc/view',
    });
  });

  it('surfaces a friendly error when the request fails', async () => {
    mockValidate({ ok: false, reason: 'timeout' });
    render(<PressKitEditCard bundle={makeBundle()} onMutate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/url do press kit/i), {
      target: { value: 'https://example.com/slow' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/demor|timeout/i),
    );
  });

  it('shows a "Limpar" button when there is a saved URL', () => {
    const onMutate = vi.fn();
    render(
      <PressKitEditCard
        bundle={makeBundle({
          pressKitUrl: 'https://www.dropbox.com/scl/fi/abc/kit.zip',
          pressKitProvider: 'dropbox',
        })}
        onMutate={onMutate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));
    expect(onMutate).toHaveBeenCalledWith('profile', { pressKitUrl: '' });
  });
});
