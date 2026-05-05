'use client';

import { isTerminalPhase, phaseLabel, type UploadPhase } from '@/lib/editor/upload-phase';

export type QueueRow = {
  id: string;
  filename: string;
  phase: UploadPhase;
  errorMessage?: string;
};

export interface UploadQueueProps {
  rows: QueueRow[];
  onClear?: () => void;
}

export function UploadQueue({ rows, onClear }: UploadQueueProps) {
  if (rows.length === 0) return null;
  const allDone = rows.every((r) => isTerminalPhase(r.phase));
  return (
    <section
      aria-label="Fila de uploads"
      className="border border-border bg-bg p-4"
    >
      <header className="flex items-center justify-between">
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          {rows.length} arquivo{rows.length > 1 ? 's' : ''}
        </p>
        {allDone && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs uppercase tracking-wider text-text-muted underline-offset-4 hover:text-text hover:underline"
          >
            Fechar
          </button>
        ) : null}
      </header>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between border border-border bg-surface px-3 py-2"
          >
            <span className="truncate text-text">{row.filename}</span>
            <span
              role="status"
              aria-live="polite"
              className={`text-xs uppercase tracking-wider ${
                row.phase === 'error' ? 'text-text' : 'text-text-muted'
              }`}
            >
              {row.phase === 'error' && row.errorMessage
                ? `Erro: ${row.errorMessage}`
                : phaseLabel(row.phase)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
