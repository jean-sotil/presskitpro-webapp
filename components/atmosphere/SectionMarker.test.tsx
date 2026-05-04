import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionMarker } from './SectionMarker';

describe('<SectionMarker />', () => {
  it('renders the formatted number and label', () => {
    render(<SectionMarker number={1} label="SOBRE" />);
    expect(screen.getByText(/01/)).toBeInTheDocument();
    expect(screen.getByText('SOBRE')).toBeInTheDocument();
  });

  it('zero-pads single-digit numbers', () => {
    render(<SectionMarker number={3} label="X" />);
    expect(screen.getByText(/^03$/)).toBeInTheDocument();
  });

  it('preserves two-digit numbers as-is', () => {
    render(<SectionMarker number={12} label="X" />);
    expect(screen.getByText(/^12$/)).toBeInTheDocument();
  });

  it('marks the entire ornament as decorative for assistive tech', () => {
    render(<SectionMarker number={1} label="SOBRE" data-testid="marker" />);
    expect(screen.getByTestId('marker')).toHaveAttribute('aria-hidden', 'true');
  });
});
