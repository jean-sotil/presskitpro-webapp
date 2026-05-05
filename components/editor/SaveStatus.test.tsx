import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SaveStatus } from './SaveStatus';

describe('SaveStatus', () => {
  it('renders the idle "Pronto" state when no save has happened yet', () => {
    render(<SaveStatus state={{ kind: 'idle', lastSavedAt: null }} />);
    expect(screen.getByText(/pronto/i)).toBeInTheDocument();
  });

  it('renders "Salvando..." with role=status during pending', () => {
    render(<SaveStatus state={{ kind: 'pending' }} />);
    expect(screen.getByRole('status')).toHaveTextContent(/salvando/i);
  });

  it('renders the relative-time string when idle with a lastSavedAt', () => {
    const fiveSecondsAgo = Date.now() - 12_000;
    render(<SaveStatus state={{ kind: 'idle', lastSavedAt: fiveSecondsAgo }} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/salvo/i);
    // The exact relative format is locale-dependent; just check we mentioned 12.
    expect(status.textContent).toMatch(/12/);
  });

  it('renders an error with a retry button that calls onRetry', () => {
    const onRetry = vi.fn();
    render(
      <SaveStatus
        state={{ kind: 'error', message: 'network', onRetry }}
      />,
    );
    const btn = screen.getByRole('alert');
    expect(btn).toHaveTextContent(/tentar de novo/i);
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
