'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { mediaUrl } from '@/lib/media/url';

export type GalleryEditItem = {
  id: number;
  bucket: string;
  path: string;
  alt: string;
  decorative: boolean;
};

export interface GalleryItemProps {
  item: GalleryEditItem;
  selected: boolean;
  altPending: boolean;
  onAltChange: (value: string) => void;
  onDecorativeToggle: (value: boolean) => void;
  onSelectToggle: (value: boolean) => void;
  onRemove: () => void;
}

export function GalleryItem({
  item,
  selected,
  altPending,
  onAltChange,
  onDecorativeToggle,
  onSelectToggle,
  onRemove,
}: GalleryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `g-${item.id}` });
  const url = mediaUrl({ bucket: item.bucket, path: item.path });
  const altMissing = !item.decorative && item.alt.trim().length === 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-3 border bg-bg p-3 transition-colors ${
        selected ? 'border-accent' : 'border-border'
      } ${isDragging ? 'opacity-60' : ''}`}
      data-testid={`gallery-item-${item.id}`}
    >
      <div className="relative">
        {url ? (
          <img
            src={url}
            alt={item.decorative ? '' : item.alt}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="aspect-square w-full bg-surface" />
        )}
        <label className="absolute left-2 top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center border border-border bg-bg/80">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectToggle(e.target.checked)}
            aria-label={`Selecionar imagem ${item.id}`}
            className="sr-only"
          />
          <span aria-hidden="true">{selected ? '✓' : ''}</span>
        </label>
        <button
          type="button"
          aria-label="Reordenar imagem"
          {...attributes}
          {...listeners}
          className="absolute right-2 top-2 inline-flex h-6 w-6 cursor-grab items-center justify-center border border-border bg-bg/80 active:cursor-grabbing"
        >
          ⋮⋮
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          Texto alternativo
        </span>
        <input
          value={item.alt}
          onChange={(e) => onAltChange(e.target.value)}
          disabled={item.decorative}
          placeholder={
            item.decorative ? 'Decorativa (alt vazio)' : 'Descreva a imagem...'
          }
          aria-invalid={altMissing}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent disabled:opacity-50"
        />
        {altMissing ? (
          <span role="alert" className="text-xs text-text-muted">
            Alt obrigatório (ou marque como decorativa).
          </span>
        ) : null}
        {altPending ? (
          <span className="text-xs text-text-muted">Salvando alt...</span>
        ) : null}
      </label>

      <div className="flex items-center justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
          <input
            type="checkbox"
            checked={item.decorative}
            onChange={(e) => onDecorativeToggle(e.target.checked)}
            className="h-4 w-4"
          />
          Decorativa
        </label>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover imagem ${item.id}`}
          className="text-xs uppercase tracking-wider text-text-muted underline-offset-4 hover:text-text hover:underline"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
