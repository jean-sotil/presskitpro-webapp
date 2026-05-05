'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { PublishDialog } from '@/components/editor/PublishDialog';
import {
  GALLERY_HARD_CAP,
  GALLERY_SOFT_CAP,
  validateGallery,
} from '@/lib/editor/gallery-validate';
import {
  bindCompressDeps,
  compressImage,
} from '@/lib/editor/image-compress';
import { liveUploadDeps, uploadMedia } from '@/lib/editor/media-upload';
import { runParallel } from '@/lib/editor/parallel-upload';
import {
  type UploadPhase,
} from '@/lib/editor/upload-phase';
import type { EditorBundle } from '@/lib/editor/bundle';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

import {
  GalleryItem,
  type GalleryEditItem,
} from '../gallery/GalleryItem';
import {
  UploadQueue,
  type QueueRow,
} from '../gallery/UploadQueue';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

export interface PhotoGalleryEditCardProps {
  bundle: EditorBundle;
  supabaseUserId: string;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

type RawGalleryEntry = number | (Partial<GalleryEditItem> & { id: number });

function normalizeGallery(raw: unknown): GalleryEditItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry: RawGalleryEntry) => {
      if (typeof entry === 'number') return null;
      const item = entry as Partial<GalleryEditItem> & { id: number };
      if (!item.id || !item.bucket || !item.path) return null;
      return {
        id: item.id,
        bucket: item.bucket,
        path: item.path,
        alt: item.alt ?? '',
        decorative: item.decorative ?? false,
      };
    })
    .filter((x): x is GalleryEditItem => x !== null);
}

export function PhotoGalleryEditCard({
  bundle,
  supabaseUserId,
  onMutate,
}: PhotoGalleryEditCardProps) {
  const qc = useQueryClient();
  const profileId = bundle.profile.id;
  const items = useMemo(
    () => normalizeGallery(bundle.profile.gallery),
    [bundle.profile.gallery],
  );

  const patchGalleryItemInCache = useCallback(
    (id: number, patch: Partial<GalleryEditItem>) => {
      qc.setQueryData<EditorBundle>(['editor', profileId], (prev) => {
        if (!prev) return prev;
        const raw = prev.profile.gallery as Array<RawGalleryEntry> | undefined;
        if (!Array.isArray(raw)) return prev;
        const nextGallery = raw.map((entry) => {
          if (typeof entry === 'number') return entry;
          if (entry.id === id) return { ...entry, ...patch };
          return entry;
        });
        return {
          ...prev,
          profile: { ...prev.profile, gallery: nextGallery },
        };
      });
    },
    [qc, profileId],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [altPending, setAltPending] = useState<Set<number>>(new Set());

  // Reset selection when the gallery changes underneath us.
  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set<number>();
      for (const id of prev) {
        if (items.some((it) => it.id === id)) valid.add(id);
      }
      return valid.size === prev.size ? prev : valid;
    });
  }, [items]);

  const validation = validateGallery(items);

  function setQueuePhase(rowId: string, phase: UploadPhase, errorMessage?: string) {
    setQueue((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, phase, errorMessage } : r)),
    );
  }

  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    if (items.length + list.length > GALLERY_HARD_CAP) {
      // eslint-disable-next-line no-alert
      window.alert(
        `Limite de ${GALLERY_HARD_CAP} fotos. Remova algumas antes de enviar mais.`,
      );
      return;
    }

    const rows: QueueRow[] = list.map((file, i) => ({
      id: `q-${Date.now()}-${i}`,
      filename: file.name,
      phase: 'queued' as UploadPhase,
    }));
    setQueue((prev) => [...prev, ...rows]);

    startTransition(async () => {
      const outcomes = await runParallel({
        items: list.map((file, i) => ({ file, rowId: rows[i]!.id })),
        concurrency: 3,
        run: async ({ file, rowId }) => {
          setQueuePhase(rowId, 'compressing');
          const compressed = await compressImage(
            file,
            undefined,
            bindCompressDeps(file),
          ).catch(() => file);
          setQueuePhase(rowId, 'uploading');
          const result = await uploadMedia(liveUploadDeps, {
            file: compressed,
            bucket: 'gallery',
            supabaseUserId,
            alt: 'Sem alt — preencher abaixo',
          });
          if (!result.ok) {
            setQueuePhase(rowId, 'error', result.reason);
            throw new Error(result.reason);
          }
          setQueuePhase(rowId, 'registering');
          // No further server work after `register` for now; mark done.
          setQueuePhase(rowId, 'done');
          return result.mediaId;
        },
      });

      const newIds: number[] = [];
      for (const o of outcomes) {
        if (o.ok) newIds.push(o.value);
      }
      if (newIds.length > 0) {
        const nextGallery = [...items.map((it) => it.id), ...newIds];
        onMutate('profile', { gallery: nextGallery });
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = items.findIndex((it) => `g-${it.id}` === active.id);
    const toIdx = items.findIndex((it) => `g-${it.id}` === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved!);
    onMutate('profile', { gallery: next.map((it) => it.id) });
  }

  function patchAlt(id: number, value: string) {
    setAltPending((prev) => new Set(prev).add(id));
    void fetch(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alt: value }),
    }).finally(() => {
      setAltPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  function patchDecorative(id: number, value: boolean) {
    setAltPending((prev) => new Set(prev).add(id));
    void fetch(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decorative: value }),
    }).finally(() => {
      setAltPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  function removeOne(id: number) {
    onMutate('profile', { gallery: items.filter((it) => it.id !== id).map((it) => it.id) });
    void fetch(`/api/media/${id}`, { method: 'DELETE' });
  }

  const confirmBulkDelete = useCallback(() => {
    const ids = Array.from(selected);
    onMutate('profile', {
      gallery: items.filter((it) => !selected.has(it.id)).map((it) => it.id),
    });
    Promise.all(
      ids.map((id) => fetch(`/api/media/${id}`, { method: 'DELETE' })),
    ).catch(() => {});
    setSelected(new Set());
    setBulkDialogOpen(false);
  }, [items, onMutate, selected]);

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Galeria
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          Galeria de fotos
        </h2>
      </header>

      {!validation.ok && validation.reason === 'missing-alt' ? (
        <p role="alert" className="border border-border bg-bg p-3 text-sm text-text">
          Imagens sem texto alternativo: {validation.indices.map((i) => i + 1).join(', ')}.
          Preencha ou marque como decorativa.
        </p>
      ) : null}
      {validation.ok && validation.warning === 'soft-cap' ? (
        <p className="border border-border bg-bg p-3 text-xs uppercase tracking-wider text-text-muted">
          {items.length} fotos · acima de {GALLERY_SOFT_CAP} a galeria pode ficar pesada.
        </p>
      ) : null}
      {!validation.ok && validation.reason === 'too-many' ? (
        <p role="alert" className="border border-border bg-bg p-3 text-sm">
          Limite atingido ({GALLERY_HARD_CAP}). Remova algumas para enviar mais.
        </p>
      ) : null}

      <Dropzone
        accept={ACCEPT}
        disabled={items.length >= GALLERY_HARD_CAP}
        onPick={handleFiles}
      />
      <UploadQueue
        rows={queue}
        onClear={() => setQueue([])}
      />

      {items.length > 0 ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((it) => `g-${it.id}`)}
            strategy={rectSortingStrategy}
          >
            <ol className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {items.map((item) => (
                <GalleryItem
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  altPending={altPending.has(item.id)}
                  onAltChange={(value) => {
                    patchGalleryItemInCache(item.id, { alt: value });
                    patchAlt(item.id, value);
                  }}
                  onDecorativeToggle={(value) => {
                    patchGalleryItemInCache(item.id, {
                      decorative: value,
                      ...(value ? { alt: '' } : {}),
                    });
                    patchDecorative(item.id, value);
                  }}
                  onSelectToggle={(value) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (value) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    })
                  }
                  onRemove={() => removeOne(item.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      ) : null}

      {selected.size > 0 ? (
        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-bg p-3">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            {selected.size} selecionada{selected.size > 1 ? 's' : ''}
          </span>
          <Button type="button" variant="ghost" onClick={() => setBulkDialogOpen(true)}>
            Excluir selecionadas
          </Button>
        </div>
      ) : null}

      <PublishDialog
        open={bulkDialogOpen}
        intent="unpublish"
        slug=""
        pending={false}
        onConfirm={confirmBulkDelete}
        onClose={() => setBulkDialogOpen(false)}
      />
    </div>
  );
}

function Dropzone({
  accept,
  disabled,
  onPick,
}: {
  accept: string;
  disabled: boolean;
  onPick: (files: FileList) => void;
}) {
  const [hover, setHover] = useState(false);

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) onPick(e.dataTransfer.files);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={`flex h-32 cursor-pointer items-center justify-center border-2 border-dashed bg-bg p-3 text-center transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border opacity-50'
          : hover
          ? 'border-accent'
          : 'border-border hover:border-accent'
      }`}
    >
      <span className="font-display text-xs uppercase tracking-wider text-text-muted">
        {disabled ? 'Limite atingido' : 'Arraste ou clique para enviar fotos'}
      </span>
      <input
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onPick(e.target.files);
        }}
        className="sr-only"
      />
    </label>
  );
}
