'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils/cn';
import { formatRelative } from '@/lib/editor/relative-time';

export type SaveStatusState =
  | { kind: 'idle'; lastSavedAt: number | null }
  | { kind: 'pending' }
  | { kind: 'error'; message: string; onRetry?: () => void };

export interface SaveStatusProps {
  state: SaveStatusState;
}

const TICK_MS = 30_000;

export function SaveStatus({ state }: SaveStatusProps) {
  // `formatRelative` calls `Date.now()`, so it can't run during SSR
  // without producing a hydration mismatch (server time != hydration
  // time). Gate the relative string on a mount flag, then re-render
  // every 30s to keep it fresh.
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (state.kind !== 'idle' || state.lastSavedAt === null) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state]);

  if (state.kind === 'pending') {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted"
      >
        <Spinner /> Salvando...
      </span>
    );
  }

  if (state.kind === 'error') {
    const handleRetry = state.onRetry;
    return (
      <button
        type="button"
        role="alert"
        onClick={handleRetry}
        className={cn(
          'inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text underline underline-offset-4',
        )}
      >
        Erro — clique para tentar de novo
      </button>
    );
  }

  // idle
  if (state.lastSavedAt === null) {
    return (
      <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
        Pronto
      </span>
    );
  }
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted"
    >
      Salvo{mounted ? ` · ${formatRelative(state.lastSavedAt)}` : ''}
    </span>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border border-t-text"
    />
  );
}
