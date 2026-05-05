import { describe, expect, it, vi } from 'vitest';

import { runParallel } from './parallel-upload';

describe('runParallel', () => {
  it('preserves submission order in the results array', async () => {
    const items = ['a', 'b', 'c', 'd'];
    // Reverse-order resolution: later items finish first.
    const run = vi.fn(async (item: string, index: number) => {
      await new Promise((r) => setTimeout(r, (items.length - index) * 5));
      return item.toUpperCase();
    });
    const results = await runParallel({ items, concurrency: 2, run });
    expect(results).toEqual([
      { ok: true, value: 'A' },
      { ok: true, value: 'B' },
      { ok: true, value: 'C' },
      { ok: true, value: 'D' },
    ]);
  });

  it('respects the concurrency cap (never more than N inflight)', async () => {
    const items = Array.from({ length: 6 }, (_, i) => i);
    let inflight = 0;
    let max = 0;
    const run = async (item: number) => {
      inflight++;
      max = Math.max(max, inflight);
      await new Promise((r) => setTimeout(r, 10));
      inflight--;
      return item;
    };
    await runParallel({ items, concurrency: 3, run });
    expect(max).toBeLessThanOrEqual(3);
  });

  it('isolates errors per item — one failure does not poison the rest', async () => {
    const items = [0, 1, 2, 3];
    const run = async (item: number) => {
      if (item === 2) throw new Error('boom');
      return item * 10;
    };
    const results = await runParallel({ items, concurrency: 2, run });
    expect(results[0]).toEqual({ ok: true, value: 0 });
    expect(results[1]).toEqual({ ok: true, value: 10 });
    expect(results[2]).toMatchObject({ ok: false, error: expect.any(Error) });
    expect(results[3]).toEqual({ ok: true, value: 30 });
  });

  it('handles an empty input list (no-op)', async () => {
    const run = vi.fn();
    const results = await runParallel({ items: [], concurrency: 3, run });
    expect(results).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });

  it('passes the index to the runner', async () => {
    const items = ['a', 'b'];
    const indices: number[] = [];
    await runParallel({
      items,
      concurrency: 1,
      run: async (item, index) => {
        indices.push(index);
        return item;
      },
    });
    expect(indices).toEqual([0, 1]);
  });
});
