import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAutosave } from './autosave';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createAutosave', () => {
  it('does not flush before the debounce window elapses', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    autosave.schedule();
    vi.advanceTimersByTime(4999);
    expect(flush).not.toHaveBeenCalled();
  });

  it('flushes once the debounce window passes', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    autosave.schedule();
    vi.advanceTimersByTime(5000);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on every schedule (true debounce — last write wins)', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    autosave.schedule();
    vi.advanceTimersByTime(4000);
    autosave.schedule();
    vi.advanceTimersByTime(4000);
    expect(flush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('flush() is a no-op when there is no pending write', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    autosave.flush();
    expect(flush).not.toHaveBeenCalled();
  });

  it('flush() runs immediately when there IS a pending write, and cancels the timer', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    autosave.schedule();
    vi.advanceTimersByTime(2000);
    autosave.flush();
    expect(flush).toHaveBeenCalledTimes(1);
    // The pre-scheduled timer must NOT fire later (would double-save).
    vi.advanceTimersByTime(5000);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('cancel() drops a pending write without firing it', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    autosave.schedule();
    autosave.cancel();
    vi.advanceTimersByTime(5000);
    expect(flush).not.toHaveBeenCalled();
  });

  it('isPending() reflects scheduled state', () => {
    const flush = vi.fn();
    const autosave = createAutosave({ debounceMs: 5000, flush });
    expect(autosave.isPending()).toBe(false);
    autosave.schedule();
    expect(autosave.isPending()).toBe(true);
    autosave.flush();
    expect(autosave.isPending()).toBe(false);
  });
});
