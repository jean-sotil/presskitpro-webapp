import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../actions', () => ({ advanceStep: vi.fn() }));

import { advanceStep } from '../actions';
import { ServicesStep } from './ServicesStep';

describe('ServicesStep', () => {
  it('disables submit when nothing selected', () => {
    render(<ServicesStep />);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('toggles a curated chip and enables submit', () => {
    render(<ServicesStep />);
    fireEvent.click(screen.getByText('DJ Set'));
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });

  it('adds a custom service via the "+ Adicionar" button', () => {
    render(<ServicesStep />);
    const draft = screen.getByPlaceholderText(/ex\./i);
    fireEvent.change(draft, { target: { value: 'Vinyl-only sets' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ adicionar/i }));
    expect(screen.getByText('Vinyl-only sets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });

  it('refuses to add a 4th custom (max 3)', () => {
    render(<ServicesStep initialCustom={['A', 'B', 'C']} initialSelected={['A', 'B', 'C']} />);
    const addBtn = screen.getByRole('button', { name: /\+ adicionar/i });
    expect(addBtn).toBeDisabled();
  });

  it('submits selected (curated + custom) on click', async () => {
    (advanceStep as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, nextStep: 5 });
    render(<ServicesStep />);
    fireEvent.click(screen.getByText('DJ Set'));
    fireEvent.click(screen.getByText('Produção'));
    fireEvent.submit(screen.getByText('DJ Set').closest('form')!);
    await waitFor(() => {
      expect(advanceStep).toHaveBeenCalledWith(4, {
        services: ['DJ Set', 'Produção'],
        customServices: [],
      });
      expect(push).toHaveBeenCalledWith('/onboarding/5');
    });
  });

  it('seeds from initialSelected', () => {
    render(<ServicesStep initialSelected={['DJ Set']} />);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });
});
