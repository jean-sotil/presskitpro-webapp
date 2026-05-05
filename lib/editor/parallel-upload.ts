/**
 * Concurrency-capped parallel runner. Used by the gallery editor to
 * upload multiple files at once without melting Supabase rate limits or
 * the user's network.
 *
 * Properties:
 *   - Results land in submission order, regardless of resolution order.
 *   - Errors per item are returned in the same shape as success — one
 *     failed file doesn't kill the others.
 *   - Concurrency is bounded; we never have more than N requests in
 *     flight.
 *
 * Pure (no DOM, no React) — the gallery editor wires the runner into
 * `uploadMedia` calls.
 */

export type ItemOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

export type RunParallelArgs<I, T> = {
  items: I[];
  concurrency: number;
  run: (item: I, index: number) => Promise<T>;
};

export async function runParallel<I, T>({
  items,
  concurrency,
  run,
}: RunParallelArgs<I, T>): Promise<ItemOutcome<T>[]> {
  if (items.length === 0) return [];
  const results: ItemOutcome<T>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const i = nextIndex++;
      if (i >= items.length) return;
      try {
        const value = await run(items[i]!, i);
        results[i] = { ok: true, value };
      } catch (err) {
        results[i] = {
          ok: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
