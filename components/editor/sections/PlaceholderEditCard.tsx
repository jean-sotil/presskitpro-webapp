import type { SectionMeta } from '@/lib/editor/sections';

export interface PlaceholderEditCardProps {
  meta: SectionMeta;
}

export function PlaceholderEditCard({ meta }: PlaceholderEditCardProps) {
  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · {meta.label}
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          {meta.label}
        </h2>
      </header>
      <p className="border border-dashed border-border p-4 text-sm text-text-muted">
        Editor completo de{' '}
        <strong className="font-display uppercase tracking-wider">{meta.label}</strong>{' '}
        chega na task-{String(meta.editorComesIn).padStart(2, '0')}.
      </p>
    </div>
  );
}
