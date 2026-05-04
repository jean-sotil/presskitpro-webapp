import { type CSSProperties } from 'react';
import { cn } from '@/lib/utils/cn';

export interface GrainProps {
  /** 0–1 — overrides `--grain-opacity` from globals.css. */
  opacity?: number;
  className?: string;
}

/**
 * Fixed-position film-grain overlay. Driven by `public/grain.png` (200×200
 * tile). Hidden via globals.css when `prefers-reduced-motion: reduce`.
 *
 * Implementation choice (per task-03 plan, decision #4): PNG tile +
 * `mix-blend-mode: overlay`, not SVG `<feTurbulence>`. PNG is cheaper to
 * paint and predictable across browsers.
 */
export function Grain({ opacity, className }: GrainProps) {
  const style: CSSProperties = {
    backgroundImage: 'url(/grain.png)',
    backgroundRepeat: 'repeat',
    backgroundSize: '200px 200px',
    mixBlendMode: 'overlay',
    opacity: opacity ?? 'var(--grain-opacity)',
  };

  return (
    <div
      data-grain=""
      data-testid="grain"
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 z-[1]', className)}
      style={style}
    />
  );
}
