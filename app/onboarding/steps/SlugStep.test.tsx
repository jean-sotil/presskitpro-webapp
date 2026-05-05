import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('../actions', () => ({
  advanceStep: vi.fn(),
}));

import { advanceStep } from '../actions';
import { SlugStep } from './SlugStep';

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function setFetchOk(body: unknown) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

describe('SlugStep', () => {
  it('shows the format hint at idle and disables submit', () => {
    render(<SlugStep debounceMs={0} />);
    expect(screen.getByText(/letras minúsculas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('flags client-side format failures before hitting the API', async () => {
    render(<SlugStep debounceMs={0} />);
    fireEvent.change(screen.getByLabelText(/url pública/i), { target: { value: 'a' } });
    await waitFor(() =>
      expect(screen.getByText(/mínimo 2 caracteres/i)).toBeInTheDocument(),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('calls /api/slug/check and shows available', async () => {
    setFetchOk({ available: true });
    render(<SlugStep debounceMs={0} />);
    fireEvent.change(screen.getByLabelText(/url pública/i), { target: { value: 'mariana-luz' } });
    await waitFor(() =>
      expect(screen.getByText(/disponível/i)).toBeInTheDocument(),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/slug/check?slug=mariana-luz',
    );
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });

  it('shows reserved label when API returns reserved', async () => {
    setFetchOk({ available: false, reason: 'reserved' });
    render(<SlugStep debounceMs={0} />);
    fireEvent.change(screen.getByLabelText(/url pública/i), { target: { value: 'admin' } });
    await waitFor(() =>
      expect(screen.getByText(/reservada/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('lower-cases user input', () => {
    render(<SlugStep debounceMs={0} />);
    const input = screen.getByLabelText(/url pública/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'BadSluG' } });
    expect(input.value).toBe('badslug');
  });

  it('seeds with initialSlug', () => {
    render(<SlugStep initialSlug="mariana-luz" debounceMs={0} />);
    expect((screen.getByLabelText(/url pública/i) as HTMLInputElement).value).toBe('mariana-luz');
  });

  it('flips the hint to "em uso" when advanceStep returns reservation-failed', async () => {
    setFetchOk({ available: true });
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      reason: 'reservation-failed',
      field: 'slug',
    });
    render(<SlugStep debounceMs={0} />);
    fireEvent.change(screen.getByLabelText(/url pública/i), { target: { value: 'mariana' } });
    await waitFor(() =>
      expect(screen.getByText(/disponível/i)).toBeInTheDocument(),
    );
    fireEvent.submit(screen.getByLabelText(/url pública/i).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/em uso/i)).toBeInTheDocument(),
    );
  });
});
