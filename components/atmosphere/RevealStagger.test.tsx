import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RevealStagger } from './RevealStagger';

describe('<RevealStagger />', () => {
  it('renders all children', () => {
    render(
      <RevealStagger>
        <p>one</p>
        <p>two</p>
        <p>three</p>
      </RevealStagger>,
    );
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
  });

  it('marks each child as a reveal target with an index', () => {
    render(
      <RevealStagger>
        <p data-testid="a">a</p>
        <p data-testid="b">b</p>
      </RevealStagger>,
    );
    expect(screen.getByTestId('a')).toHaveAttribute('data-reveal');
    expect(screen.getByTestId('a')).toHaveStyle({ '--reveal-index': '0' });
    expect(screen.getByTestId('b')).toHaveStyle({ '--reveal-index': '1' });
  });

  it('preserves existing styles on children', () => {
    render(
      <RevealStagger>
        <p data-testid="a" style={{ color: 'red' }}>
          a
        </p>
      </RevealStagger>,
    );
    expect(screen.getByTestId('a')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
