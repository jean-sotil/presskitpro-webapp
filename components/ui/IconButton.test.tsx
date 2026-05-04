import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('<IconButton />', () => {
  it('exposes the accessible label via aria-label', () => {
    render(
      <IconButton label="Apagar">
        <svg data-testid="icon" />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeInTheDocument();
  });

  it('hides the icon from assistive tech (label carries the meaning)', () => {
    render(
      <IconButton label="Apagar">
        <svg data-testid="icon" />
      </IconButton>,
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it("meets Fitts's Law minimum touch target (≥ 44px square)", () => {
    render(
      <IconButton label="x">
        <svg />
      </IconButton>,
    );
    const btn = screen.getByRole('button');
    // Square sized via h-11 w-11 (44px) per the design system.
    expect(btn.className).toMatch(/h-11/);
    expect(btn.className).toMatch(/w-11/);
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <IconButton label="x" onClick={onClick}>
        <svg />
      </IconButton>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
