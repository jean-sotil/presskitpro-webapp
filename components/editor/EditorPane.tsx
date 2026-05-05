'use client';

import { Button } from '@/components/ui/Button';
import { SECTIONS } from '@/lib/editor/sections';
import type { SectionKey } from '@/lib/editor/section-order';

export interface EditorPaneProps {
  active: SectionKey;
  /** A controlled tagline binding so the shell ships at least one mutating
   *  field (drives the autosave + preview test path). Real per-section
   *  forms land in tasks 10–17. */
  tagline: string;
  onTaglineChange: (value: string) => void;
  /** Slug binding (the only top-level Profile field exposed in the shell). */
  slug: string;
  onSlugChange: (value: string) => void;
}

export function EditorPane({
  active,
  tagline,
  onTaglineChange,
  slug,
  onSlugChange,
}: EditorPaneProps) {
  const meta = SECTIONS[active];
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

      {/* The shell exposes two universally-needed bindings on every
          section so the user has SOMETHING to edit on day one. The full
          per-section UI lands in tasks 10–17. */}
      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-text-muted">URL pública</span>
        <input
          value={slug}
          onChange={(e) => onSlugChange(e.target.value.toLowerCase())}
          className="h-10 border border-border bg-bg px-3 text-base outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-text-muted">Tagline</span>
        <input
          value={tagline}
          onChange={(e) => onTaglineChange(e.target.value)}
          maxLength={140}
          className="h-10 border border-border bg-bg px-3 text-base outline-none focus:border-accent"
        />
      </label>

      <p className="border border-dashed border-border p-4 text-sm text-text-muted">
        Editor completo de <strong className="font-display uppercase tracking-wider">{meta.label}</strong>
        {' '}chega na task-{String(meta.editorComesIn).padStart(2, '0')}.
      </p>

      <div className="flex justify-end">
        <Button variant="ghost" type="button" disabled>
          Cancelar (sem mudanças)
        </Button>
      </div>
    </div>
  );
}
