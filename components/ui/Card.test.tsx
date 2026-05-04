import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('<Card />', () => {
  it('renders children', () => {
    render(
      <Card>
        <p>Inside</p>
      </Card>,
    );
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });

  it('uses the surface token and a hairline border', () => {
    render(<Card data-testid="card" />);
    const el = screen.getByTestId('card');
    expect(el.className).toMatch(/bg-surface/);
    expect(el.className).toMatch(/border/);
  });

  it('has no rounded corners (default radius is 0)', () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId('card').className).not.toMatch(/rounded-[a-z]+/);
  });

  it('forwards arbitrary HTML attributes', () => {
    render(<Card aria-label="bio" data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'bio');
  });
});
