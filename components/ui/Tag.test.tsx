import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './Tag';

describe('<Tag />', () => {
  it('renders its label', () => {
    render(<Tag>Techno</Tag>);
    expect(screen.getByText('Techno')).toBeInTheDocument();
  });

  it('uses the accent border to read as interactive metadata', () => {
    render(<Tag data-testid="tag">Tag</Tag>);
    expect(screen.getByTestId('tag').className).toMatch(/border/);
  });

  it('keeps sharp edges (radius 0)', () => {
    render(<Tag data-testid="tag">Tag</Tag>);
    expect(screen.getByTestId('tag').className).not.toMatch(/rounded-(?!none)/);
  });

  it('forwards arbitrary attributes', () => {
    render(
      <Tag aria-label="genre" data-testid="tag">
        Tag
      </Tag>,
    );
    expect(screen.getByTestId('tag')).toHaveAttribute('aria-label', 'genre');
  });
});
