import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepRail } from './StepRail';

describe('StepRail', () => {
  it('marks the current step with aria-current="step"', () => {
    render(<StepRail current={3} highestCompleted={3} />);
    const current = screen.getByRole('link', { current: 'step' });
    expect(current).toHaveAttribute('href', '/onboarding/3');
  });

  it('exposes done steps as links', () => {
    render(<StepRail current={3} highestCompleted={3} />);
    expect(screen.getByRole('link', { name: /url/i })).toHaveAttribute('href', '/onboarding/1');
    expect(screen.getByRole('link', { name: /imagens/i })).toHaveAttribute('href', '/onboarding/2');
  });

  it('does not render locked future steps as links (no focusable element)', () => {
    render(<StepRail current={2} highestCompleted={2} />);
    // Steps 3, 4, 5 are locked → no <a>.
    expect(screen.queryByRole('link', { name: /serviços/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /redes sociais/i })).toBeNull();
  });
});
