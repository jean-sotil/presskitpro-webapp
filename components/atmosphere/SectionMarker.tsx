import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SectionMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  /** 1-based section number; rendered zero-padded to two digits. */
  number: number;
  /** Short uppercase label (e.g. "SOBRE", "SERVIÇOS"). */
  label: string;
}

/**
 * Editorial numbered marker: `01 — SOBRE`. Decorative — the actual heading
 * is its semantic sibling. Marked aria-hidden in its entirety so screen
 * readers consume only the heading.
 */
export function SectionMarker({ number, label, className, ...props }: SectionMarkerProps) {
  const padded = String(number).padStart(2, '0');
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center gap-3 font-display text-xs uppercase tracking-[0.25em] text-text-muted',
        className,
      )}
      {...props}
    >
      <span>{padded}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </span>
  );
}
