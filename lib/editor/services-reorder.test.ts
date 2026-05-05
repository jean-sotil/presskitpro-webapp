import { describe, expect, it } from 'vitest';

import { reorderServices } from './services-reorder';

const items = [
  { title: 'A' },
  { title: 'B' },
  { title: 'C' },
  { title: 'D' },
];

describe('reorderServices', () => {
  it('moves an item from index to a higher index', () => {
    expect(reorderServices(items, 0, 2)).toEqual([
      { title: 'B' },
      { title: 'C' },
      { title: 'A' },
      { title: 'D' },
    ]);
  });

  it('moves an item from index to a lower index', () => {
    expect(reorderServices(items, 3, 1)).toEqual([
      { title: 'A' },
      { title: 'D' },
      { title: 'B' },
      { title: 'C' },
    ]);
  });

  it('returns unchanged when from === to', () => {
    expect(reorderServices(items, 1, 1)).toEqual(items);
  });

  it('returns unchanged when an index is out of range', () => {
    expect(reorderServices(items, -1, 2)).toEqual(items);
    expect(reorderServices(items, 0, 99)).toEqual(items);
  });

  it('does not mutate the input array', () => {
    const before = [...items];
    reorderServices(items, 0, 3);
    expect(items).toEqual(before);
  });
});
