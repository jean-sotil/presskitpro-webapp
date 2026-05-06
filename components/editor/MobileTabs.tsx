'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils/cn';

export type MobileTab = 'edit' | 'preview';

const HASH_FOR: Record<MobileTab, string> = {
  edit: '#edit',
  preview: '#preview',
};

export interface MobileTabsProps {
  /** Override default URL-hash sync (tests pass `false`). */
  syncHash?: boolean;
  initial?: MobileTab;
  onChange?: (tab: MobileTab) => void;
  /** The two panes, keyed by tab. */
  panes: Record<MobileTab, React.ReactNode>;
}

const TABS: Array<{ key: MobileTab; label: string }> = [
  { key: 'edit', label: 'Editar' },
  { key: 'preview', label: 'Visualizar' },
];

export function MobileTabs({
  syncHash = true,
  initial = 'edit',
  onChange,
  panes,
}: MobileTabsProps) {
  const [active, setActive] = useState<MobileTab>(initial);

  useEffect(() => {
    if (!syncHash) return;
    const fromHash = window.location.hash;
    if (fromHash === '#preview') setActive('preview');
    else if (fromHash === '#edit') setActive('edit');
  }, [syncHash]);

  function pick(next: MobileTab) {
    setActive(next);
    if (syncHash && typeof window !== 'undefined') {
      window.history.replaceState(null, '', HASH_FOR[next]);
    }
    onChange?.(next);
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = TABS.findIndex((t) => t.key === active);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      pick(TABS[(idx + 1) % TABS.length]!.key);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      pick(TABS[(idx - 1 + TABS.length) % TABS.length]!.key);
    } else if (e.key === 'Home') {
      e.preventDefault();
      pick(TABS[0]!.key);
    } else if (e.key === 'End') {
      e.preventDefault();
      pick(TABS[TABS.length - 1]!.key);
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Editor / preview"
        onKeyDown={onKey}
        tabIndex={-1}
        className="flex border-b border-border"
      >
        {TABS.map(({ key, label }) => {
          const selected = key === active;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              id={`mobile-tab-${key}`}
              aria-selected={selected}
              aria-controls={`mobile-panel-${key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => pick(key)}
              className={cn(
                'flex-1 px-4 py-3 text-xs uppercase tracking-wider transition-colors',
                selected ? 'border-b-2 border-accent text-text' : 'text-text-muted',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {TABS.map(({ key }) => (
        <div
          key={key}
          role="tabpanel"
          id={`mobile-panel-${key}`}
          aria-labelledby={`mobile-tab-${key}`}
          hidden={key !== active}
        >
          {panes[key]}
        </div>
      ))}
    </div>
  );
}
