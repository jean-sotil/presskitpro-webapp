'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { EditorBundle } from '@/lib/editor/bundle';
import type { SectionKey } from '@/lib/editor/section-order';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';
import { SECTIONS } from '@/lib/editor/sections';

export interface BlocksTabProps {
  active: SectionKey;
  order: SectionKey[];
  bundle: EditorBundle;
  onSelect: (key: SectionKey) => void;
  onReorder: (next: SectionKey[]) => void;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

export function BlocksTab({
  active,
  order,
  bundle,
  onSelect,
  onReorder,
  onMutate,
}: BlocksTabProps) {
  const [draggedKey, setDraggedKey] = useState<SectionKey | null>(null);

  const handleDragStart = (key: SectionKey) => {
    setDraggedKey(key);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetKey: SectionKey) => {
    if (!draggedKey || draggedKey === targetKey) return;

    const draggedIdx = order.indexOf(draggedKey);
    const targetIdx = order.indexOf(targetKey);

    const next = [...order];
    next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, draggedKey);

    onReorder(next);
    setDraggedKey(null);
  };

  return (
    <div className="flex flex-col gap-2 px-3 pb-4">
      {order.map((key) => {
        const section = SECTIONS[key];
        const isOpen = active === key;
        const displayName = section.label || key;

        return (
          <div
            key={key}
            draggable
            onDragStart={() => handleDragStart(key)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(key)}
            className={cn(
              'group border overflow-hidden transition-all rounded',
              'bg-surface border-border',
              isOpen && 'border-l-2 border-l-accent',
              draggedKey === key && 'opacity-60',
            )}
          >
            <button
              onClick={() => onSelect(key)}
              className={cn(
                'w-full px-3.5 h-11 flex items-center justify-between cursor-pointer transition-colors',
                'text-xs uppercase tracking-wider font-display font-medium',
                isOpen ? 'text-accent' : 'text-text',
                'hover:bg-border',
              )}
            >
              <span>{displayName}</span>
              <div className="flex items-center gap-2 text-text-muted">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 140ms ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={cn('transition-opacity', 'group-hover:opacity-100 opacity-0')}
                >
                  <circle cx="5" cy="8" r="1"></circle>
                  <circle cx="5" cy="14" r="1"></circle>
                  <circle cx="5" cy="20" r="1"></circle>
                  <circle cx="12" cy="8" r="1"></circle>
                  <circle cx="12" cy="14" r="1"></circle>
                  <circle cx="12" cy="20" r="1"></circle>
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border px-3.5 py-4">
                <p className="text-xs text-text-muted italic">
                  Content for {displayName} would render here
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
