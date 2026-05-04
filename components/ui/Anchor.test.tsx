import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Anchor } from './Anchor';

describe('<Anchor />', () => {
  it('renders an <a> with the given href', () => {
    render(<Anchor href="/sobre">Sobre nós</Anchor>);
    const link = screen.getByRole('link', { name: 'Sobre nós' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/sobre');
  });

  it('applies the accent text color', () => {
    render(<Anchor href="/x">link</Anchor>);
    expect(screen.getByRole('link').className).toMatch(/text-accent/);
  });

  it('opens external links with rel/target safety defaults', () => {
    render(
      <Anchor href="https://instagram.com/x" external>
        IG
      </Anchor>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not set target on internal links', () => {
    render(<Anchor href="/x">internal</Anchor>);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
  });
});
