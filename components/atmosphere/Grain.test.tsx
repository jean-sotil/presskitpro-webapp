import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grain } from './Grain';

describe('<Grain />', () => {
  it('renders a fixed overlay marked with data-grain', () => {
    render(<Grain />);
    const overlay = screen.getByTestId('grain');
    expect(overlay).toHaveAttribute('data-grain');
  });

  it('is hidden from assistive tech', () => {
    render(<Grain />);
    expect(screen.getByTestId('grain')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not capture pointer events', () => {
    render(<Grain />);
    expect(screen.getByTestId('grain').className).toMatch(/pointer-events-none/);
  });

  it('honors a custom opacity prop', () => {
    render(<Grain opacity={0.1} />);
    expect(screen.getByTestId('grain')).toHaveStyle({ opacity: '0.1' });
  });
});
