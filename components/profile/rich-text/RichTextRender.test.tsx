import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichTextRender } from './RichTextRender';

describe('RichTextRender', () => {
  it('returns null for an empty/null state', () => {
    const { container: a } = render(<RichTextRender state={null} />);
    expect(a.firstChild).toBeNull();
    const { container: b } = render(<RichTextRender state={{ root: { children: [] } }} />);
    expect(b.firstChild).toBeNull();
  });

  it('renders paragraphs', () => {
    render(
      <RichTextRender
        state={{
          root: {
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: 'House melódico de SP' }],
              },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText('House melódico de SP').tagName).toBe('P');
  });

  it('renders h2 + h3', () => {
    render(
      <RichTextRender
        state={{
          root: {
            children: [
              { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Sobre' }] },
              { type: 'heading', tag: 'h3', children: [{ type: 'text', text: 'Carreira' }] },
            ],
          },
        }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: /sobre/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /carreira/i })).toBeInTheDocument();
  });

  it('renders bullet + numbered lists', () => {
    const { container } = render(
      <RichTextRender
        state={{
          root: {
            children: [
              {
                type: 'list',
                listType: 'bullet',
                children: [
                  { type: 'listitem', children: [{ type: 'text', text: 'D-Edge' }] },
                  { type: 'listitem', children: [{ type: 'text', text: 'Warung' }] },
                ],
              },
              {
                type: 'list',
                listType: 'number',
                children: [
                  { type: 'listitem', children: [{ type: 'text', text: 'first' }] },
                ],
              },
            ],
          },
        }}
      />,
    );
    expect(container.querySelector('ul')).not.toBeNull();
    expect(container.querySelector('ol')).not.toBeNull();
    expect(screen.getByText('D-Edge').tagName).toBe('LI');
  });

  it('renders bold + italic + underline via format bitfield', () => {
    const { container } = render(
      <RichTextRender
        state={{
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: 'b', format: 1 },
                  { type: 'text', text: 'i', format: 2 },
                  { type: 'text', text: 'u', format: 8 },
                  { type: 'text', text: 'bi', format: 3 },
                ],
              },
            ],
          },
        }}
      />,
    );
    expect(container.querySelector('strong')?.textContent).toContain('b');
    expect(container.querySelector('em')?.textContent).toContain('i');
    expect(container.querySelector('u')?.textContent).toContain('u');
    // bold + italic combined = strong wrapping em
    expect(container.querySelector('strong em')).not.toBeNull();
  });

  it('renders links with rel=noopener noreferrer by default', () => {
    render(
      <RichTextRender
        state={{
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'link',
                    url: 'https://example.com',
                    target: '_blank',
                    children: [{ type: 'text', text: 'Anjunadeep' }],
                  },
                ],
              },
            ],
          },
        }}
      />,
    );
    const a = screen.getByRole('link', { name: /anjunadeep/i });
    expect(a).toHaveAttribute('href', 'https://example.com');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders linebreak as <br />', () => {
    const { container } = render(
      <RichTextRender
        state={{
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: 'a' },
                  { type: 'linebreak' },
                  { type: 'text', text: 'b' },
                ],
              },
            ],
          },
        }}
      />,
    );
    expect(container.querySelector('br')).not.toBeNull();
  });

  it('forward-compat: unknown node types render their children', () => {
    render(
      <RichTextRender
        state={{
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'unknown-future-node',
                    children: [{ type: 'text', text: 'still readable' }],
                  },
                ],
              },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText('still readable')).toBeInTheDocument();
  });
});
