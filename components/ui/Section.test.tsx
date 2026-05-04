import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './Section';

describe('<Section />', () => {
  it('renders as a <section> element', () => {
    render(
      <Section data-testid="s">
        <p>content</p>
      </Section>,
    );
    expect(screen.getByTestId('s').tagName).toBe('SECTION');
  });

  it('applies vertical rhythm padding', () => {
    render(<Section data-testid="s" />);
    expect(screen.getByTestId('s').className).toMatch(/py-/);
  });

  it('accepts a custom id for anchor navigation', () => {
    render(<Section id="sobre" data-testid="s" />);
    expect(screen.getByTestId('s')).toHaveAttribute('id', 'sobre');
  });

  it('renders children into the layout', () => {
    render(
      <Section>
        <h2>SOBRE</h2>
      </Section>,
    );
    expect(screen.getByRole('heading', { name: 'SOBRE' })).toBeInTheDocument();
  });
});
