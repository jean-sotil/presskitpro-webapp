import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../actions', () => ({
  advanceStep: vi.fn(),
  completeWizard: vi.fn(),
}));

import { advanceStep, completeWizard } from '../actions';
import { SocialStep } from './SocialStep';

describe('SocialStep', () => {
  it('disables submit on empty url', () => {
    render(<SocialStep />);
    expect(screen.getByRole('button', { name: /concluir/i })).toBeDisabled();
  });

  it('lists every PRD-§7 platform', () => {
    render(<SocialStep />);
    expect(screen.getByLabelText(/plataforma/i)).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBeGreaterThanOrEqual(13);
  });

  it('updates the placeholder when the platform changes', () => {
    render(<SocialStep />);
    const url = screen.getByLabelText(/url ou contato/i) as HTMLInputElement;
    expect(url.placeholder).toMatch(/instagram\.com/);
    fireEvent.change(screen.getByLabelText(/plataforma/i), {
      target: { value: 'soundcloud' },
    });
    expect(url.placeholder).toMatch(/soundcloud\.com/);
  });

  it('on submit advances + completes + redirects to /dashboard/profile/:id', async () => {
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, nextStep: 5 });
    (completeWizard as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      profileId: 99,
    });
    render(<SocialStep />);
    fireEvent.change(screen.getByLabelText(/url ou contato/i), {
      target: { value: 'https://instagram.com/marianaluz' },
    });
    fireEvent.submit(screen.getByLabelText(/url ou contato/i).closest('form')!);
    await waitFor(() => {
      expect(advanceStep).toHaveBeenCalledWith(5, {
        socialPlatform: 'instagram',
        socialUrl: 'https://instagram.com/marianaluz',
      });
      expect(completeWizard).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/dashboard/profile/99');
    });
  });

  it('surfaces an invalid-url server error inline', async () => {
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      field: 'socialUrl',
      reason: 'invalid-url',
    });
    render(<SocialStep />);
    fireEvent.change(screen.getByLabelText(/url ou contato/i), {
      target: { value: 'not a url' },
    });
    fireEvent.submit(screen.getByLabelText(/url ou contato/i).closest('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/url inválida/i),
    );
  });

  it('surfaces an "incomplete" error if completeWizard says so', async () => {
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, nextStep: 5 });
    (completeWizard as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      reason: 'incomplete',
    });
    render(<SocialStep />);
    fireEvent.change(screen.getByLabelText(/url ou contato/i), {
      target: { value: 'https://instagram.com/x' },
    });
    fireEvent.submit(screen.getByLabelText(/url ou contato/i).closest('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/incompleto/i),
    );
  });
});
