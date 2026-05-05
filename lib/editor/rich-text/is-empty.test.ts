import { describe, expect, it } from 'vitest';

import { isEmptyLexicalState } from './is-empty';

describe('isEmptyLexicalState', () => {
  it('returns true for null/undefined', () => {
    expect(isEmptyLexicalState(null)).toBe(true);
    expect(isEmptyLexicalState(undefined)).toBe(true);
  });

  it('returns true for an empty root', () => {
    expect(isEmptyLexicalState({ root: { children: [] } })).toBe(true);
  });

  it('returns true for a single empty paragraph (Lexical default initial state)', () => {
    expect(
      isEmptyLexicalState({
        root: {
          children: [{ type: 'paragraph', children: [] }],
        },
      }),
    ).toBe(true);
  });

  it('returns true for a paragraph containing only whitespace', () => {
    expect(
      isEmptyLexicalState({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: '   ' }],
            },
          ],
        },
      }),
    ).toBe(true);
  });

  it('returns false when there is any meaningful text', () => {
    expect(
      isEmptyLexicalState({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'a' }],
            },
          ],
        },
      }),
    ).toBe(false);
  });
});
