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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/Button';
import type { EditorBundle } from '@/lib/editor/bundle';
import {
  MAX_SERVICES,
  type ServiceItem,
  validateServiceItem,
} from '@/lib/editor/services-validate';
import { reorderServices } from '@/lib/editor/services-reorder';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

export interface ServicesEditCardProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

export function ServicesEditCard({ bundle, onMutate }: ServicesEditCardProps) {
  const services = (bundle.content?.services as ServiceItem[] | undefined) ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(next: ServiceItem[]) {
    onMutate('content', { services: next });
  }

  function patchAt(index: number, partial: Partial<ServiceItem>) {
    const next = services.map((s, i) => (i === index ? { ...s, ...partial } : s));
    update(next);
  }

  function remove(index: number) {
    update(services.filter((_, i) => i !== index));
  }

  function add() {
    if (services.length >= MAX_SERVICES) return;
    update([...services, { title: '', description: '' }]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = services.findIndex((_, i) => `s-${i}` === active.id);
    const toIndex = services.findIndex((_, i) => `s-${i}` === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    update(reorderServices(services, fromIndex, toIndex));
  }

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Serviços
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">Serviços</h2>
      </header>

      {services.length === 0 ? (
        <p className="border border-dashed border-border p-4 text-sm text-text-muted">
          Nenhum serviço cadastrado. Adicione o primeiro abaixo (DJ Set, Produção,
          Mixagem...).
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={services.map((_, i) => `s-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-3">
              {services.map((service, i) => (
                <SortableServiceRow
                  key={`s-${i}`}
                  id={`s-${i}`}
                  service={service}
                  onChange={(partial) => patchAt(i, partial)}
                  onRemove={() => remove(i)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div>
        <Button type="button" onClick={add} disabled={services.length >= MAX_SERVICES}>
          + Adicionar serviço
        </Button>
        {services.length >= MAX_SERVICES ? (
          <p className="mt-2 text-xs text-text-muted">
            Máximo {MAX_SERVICES} serviços por perfil.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SortableServiceRow({
  id,
  service,
  onChange,
  onRemove,
}: {
  id: string;
  service: ServiceItem;
  onChange: (partial: Partial<ServiceItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const validation = validateServiceItem(service);
  const titleError = !validation.ok && validation.reason === 'title-required';
  const descError =
    !validation.ok &&
    (validation.reason === 'title-too-long' ||
      validation.reason === 'description-too-long');

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-stretch border border-border bg-bg ${isDragging ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        aria-label="Reordenar serviço"
        {...attributes}
        {...listeners}
        className="grid w-8 cursor-grab place-items-center border-r border-border text-text-muted hover:text-text active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <input
          value={service.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Título do serviço"
          maxLength={80}
          aria-invalid={titleError}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
        {titleError ? (
          <span role="alert" className="text-xs text-text-muted">
            Título é obrigatório.
          </span>
        ) : null}
        <textarea
          value={service.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descrição (opcional)"
          maxLength={240}
          rows={2}
          aria-invalid={descError}
          className="resize-none border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover serviço"
        className="grid w-10 cursor-pointer place-items-center border-l border-border text-text-muted hover:text-text"
      >
        ×
      </button>
    </li>
  );
}
