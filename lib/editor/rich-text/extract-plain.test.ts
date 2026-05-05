import { describe, expect, it } from 'vitest';

import { extractPlainText } from './extract-plain';

const empty = { root: { children: [] } };

const para = {
  root: {
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'House melódico de SP.' }],
      },
    ],
  },
};

const heading = {
  root: {
    children: [
      {
        type: 'heading',
        tag: 'h2',
        children: [{ type: 'text', text: 'Sobre' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'DJ ' },
          { type: 'text', text: 'paulistana', format: 1 /* bold */ },
        ],
      },
    ],
  },
};

const list = {
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
    ],
  },
};

describe('extractPlainText', () => {
  it('returns empty string for null/undefined/empty state', () => {
    expect(extractPlainText(null)).toBe('');
    expect(extractPlainText(undefined)).toBe('');
    expect(extractPlainText(empty)).toBe('');
  });

  it('extracts paragraph text', () => {
    expect(extractPlainText(para)).toBe('House melódico de SP.');
  });

  it('preserves block separation as a single space (suitable for SEO meta)', () => {
    expect(extractPlainText(heading)).toBe('Sobre DJ paulistana');
  });

  it('walks list items', () => {
    expect(extractPlainText(list)).toBe('D-Edge Warung');
  });

  it('ignores non-text leaves (e.g. line breaks)', () => {
    const state = {
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
    };
    expect(extractPlainText(state)).toBe('a b');
  });

  it('handles nested children defensively (deep tree)', () => {
    const state = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                children: [{ type: 'text', text: 'Anjunadeep' }],
              },
            ],
          },
        ],
      },
    };
    expect(extractPlainText(state)).toBe('Anjunadeep');
  });
});
