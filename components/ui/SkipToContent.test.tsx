import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkipToContent } from './SkipToContent';

describe('<SkipToContent />', () => {
  it('renders an anchor pointing at #main by default', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: /pular para o conteúdo/i });
    expect(link).toHaveAttribute('href', '#main');
  });

  it('respects a custom target', () => {
    render(<SkipToContent target="content" />);
    const link = screen.getByRole('link', { name: /pular para o conteúdo/i });
    expect(link).toHaveAttribute('href', '#content');
  });

  it('is visually hidden until focused (carries `sr-only` + a focus-visible reveal class)', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.className).toMatch(/sr-only/);
    // The reveal classes use `focus:` — assert the prefix is present so a
    // future styling drift surfaces in the test, not on a keyboard user.
    expect(link.className).toMatch(/focus:/);
  });

  it('is the first focusable element when rendered before <main>', () => {
    render(
      <>
        <SkipToContent />
        <main id="main">
          <button type="button">Real button</button>
        </main>
      </>,
    );
    const link = screen.getByRole('link');
    // Tab order is document order for elements without tabindex; the
    // link comes before the button, so it's first to focus.
    expect(link.compareDocumentPosition(screen.getByRole('button'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
