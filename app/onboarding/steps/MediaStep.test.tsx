import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../actions', () => ({ advanceStep: vi.fn() }));

import { advanceStep } from '../actions';
import { MediaStep } from './MediaStep';

beforeEach(() => {
  push.mockClear();
  globalThis.fetch = vi.fn();
  // jsdom doesn't ship URL.createObjectURL.
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn().mockReturnValue('blob:mock'),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('MediaStep', () => {
  it('renders both dropzones + skip button', () => {
    render(<MediaStep supabaseUserId="sb-1" />);
    expect(screen.getByText(/foto principal/i)).toBeInTheDocument();
    expect(screen.getByText(/logo \(opcional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pular/i })).toBeInTheDocument();
  });

  it('calls advanceStep(2) with both ids null on Skip', async () => {
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, nextStep: 3 });
    render(<MediaStep supabaseUserId="sb-1" />);
    fireEvent.click(screen.getByRole('button', { name: /pular/i }));
    await waitFor(() => {
      expect(advanceStep).toHaveBeenCalledWith(2, {
        portraitId: null,
        logoId: null,
      });
      expect(push).toHaveBeenCalledWith('/onboarding/3');
    });
  });

  it('runs the 3-step upload chain and stores the returned media id', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'https://signed.example/upload', path: 'sb-1/abc.jpg' }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 17 }) });
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, nextStep: 3 });

    render(<MediaStep supabaseUserId="sb-1" />);
    const file = new File(['x'], 'portrait.jpg', { type: 'image/jpeg' });
    const inputs = document.querySelectorAll('input[type="file"]');
    fireEvent.change(inputs[0]!, { target: { files: [file] } });
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/storage/sign-upload',
        expect.any(Object),
      ),
    );
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        2,
        'https://signed.example/upload',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        3,
        '/api/media',
        expect.any(Object),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    await waitFor(() => {
      expect(advanceStep).toHaveBeenCalledWith(2, {
        portraitId: 17,
        logoId: null,
      });
    });
  });

  it('surfaces upload errors per slot without breaking the page', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });
    render(<MediaStep supabaseUserId="sb-1" />);
    const file = new File(['x'], 'portrait.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/upload-sign-failed/),
    );
  });
});
