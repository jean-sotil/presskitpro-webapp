/**
 * Debounced autosave coordinator.
 *
 * Used by the editor client island: every input change calls `schedule()`,
 * which arms a 5s timer (PRD §6.3 spec). When the user stops typing for
 * 5s, `flush` fires. The `visibilitychange` listener calls `flush()`
 * directly to flush any pending write before the tab is hidden.
 *
 * Pure (no React, no DOM) — tests inject a flush stub.
 */

export type Autosave = {
  schedule(): void;
  flush(): void;
  cancel(): void;
  isPending(): boolean;
};

export type AutosaveDeps = {
  debounceMs: number;
  flush: () => void;
};

export function createAutosave({ debounceMs, flush }: AutosaveDeps): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    schedule() {
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        flush();
      }, debounceMs);
    },
    flush() {
      if (timer === null) return;
      clearTimer();
      flush();
    },
    cancel() {
      clearTimer();
    },
    isPending() {
      return timer !== null;
    },
  };
}
