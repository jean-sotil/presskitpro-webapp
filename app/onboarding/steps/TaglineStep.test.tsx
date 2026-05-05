import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../actions', () => ({ advanceStep: vi.fn() }));

import { advanceStep } from '../actions';
import { TaglineStep } from './TaglineStep';

describe('TaglineStep', () => {
  it('disables submit on empty input', () => {
    render(<TaglineStep />);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('shows the remaining-character counter', () => {
    render(<TaglineStep />);
    expect(screen.getByText('140 caracteres restantes')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tagline/i), { target: { value: 'House SP' } });
    expect(screen.getByText('132 caracteres restantes')).toBeInTheDocument();
  });

  it('caps input at 140 chars (browser-enforced via maxLength)', () => {
    render(<TaglineStep />);
    const input = screen.getByLabelText(/tagline/i) as HTMLInputElement;
    expect(input.maxLength).toBe(140);
  });

  it('submits + redirects on success', async () => {
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, nextStep: 4 });
    render(<TaglineStep />);
    fireEvent.change(screen.getByLabelText(/tagline/i), {
      target: { value: 'House melódico de São Paulo' },
    });
    fireEvent.submit(screen.getByLabelText(/tagline/i).closest('form')!);
    await waitFor(() => {
      expect(advanceStep).toHaveBeenCalledWith(3, {
        taglinePtBR: 'House melódico de São Paulo',
      });
      expect(push).toHaveBeenCalledWith('/onboarding/4');
    });
  });

  it('seeds with the initial value', () => {
    render(<TaglineStep initial="já tinha" />);
    expect((screen.getByLabelText(/tagline/i) as HTMLInputElement).value).toBe('já tinha');
  });
});
