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

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils/cn';
import { reorderSection, type SectionKey } from '@/lib/editor/section-order';

export interface SectionRailProps {
  order: SectionKey[];
  active: SectionKey;
  labels: Record<SectionKey, string>;
  onSelect: (key: SectionKey) => void;
  onReorder: (next: SectionKey[]) => void;
}

/**
 * Vertical drag-reorder list for the editor's left rail.
 *
 * Touch sensor has a 200ms long-press delay so taps don't accidentally
 * start drags on iOS Safari. Keyboard sensor uses dnd-kit's sortable
 * coordinates so arrow keys move items per the WAI-ARIA Authoring
 * Practices.
 */
export function SectionRail({
  order,
  active,
  labels,
  onSelect,
  onReorder,
}: SectionRailProps) {
  const t = useTranslations('editor.rail');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active: from, over } = event;
    if (!over || from.id === over.id) return;
    onReorder(reorderSection(order, from.id as SectionKey, over.id as SectionKey));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol aria-label={t('ariaLabel')} className="flex flex-col gap-2">
          {order.map((key) => (
            <SortableItem
              key={key}
              keyId={key}
              label={labels[key]}
              active={key === active}
              onSelect={() => onSelect(key)}
              reorderLabel={t('reorderItem', { label: labels[key] })}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  keyId,
  label,
  active,
  onSelect,
  reorderLabel,
}: {
  keyId: SectionKey;
  label: string;
  active: boolean;
  onSelect: () => void;
  reorderLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: keyId });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-stretch border transition-colors',
        active ? 'border-accent bg-surface' : 'border-border',
        isDragging && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex-1 px-3 py-2 text-left text-xs uppercase tracking-wider',
          active ? 'text-text' : 'text-text-muted',
        )}
      >
        {label}
      </button>
      <button
        type="button"
        aria-label={reorderLabel}
        {...attributes}
        {...listeners}
        className="grid w-8 cursor-grab place-items-center border-l border-border text-text-muted hover:text-text active:cursor-grabbing"
      >
        ⋮⋮
      </button>
    </li>
  );
}
