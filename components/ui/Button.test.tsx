import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('<Button />', () => {
  it('renders its children', () => {
    render(<Button>Reservar</Button>);
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument();
  });

  it('applies the primary variant by default', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');
    // Primary uses the accent token as background.
    expect(btn.className).toMatch(/bg-accent/);
    expect(btn.className).toMatch(/text-accent-contrast/);
  });

  it('respects an explicit variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).not.toMatch(/bg-accent\b/);
    expect(btn.className).toMatch(/border/);
  });

  it('forwards the size prop', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toMatch(/text-lg|h-12|px-8/);
  });

  it('fires onClick once on user click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Press</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks click when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('supports asChild render delegation via the link variant', () => {
    render(<Button variant="link">Plain link</Button>);
    expect(screen.getByRole('button').className).toMatch(/underline/);
  });
});
