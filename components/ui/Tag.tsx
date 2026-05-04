import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export type TagProps = HTMLAttributes<HTMLSpanElement>;

/**
 * Sharp-edged metadata pill (e.g., music genres, services). Editorial flat —
 * no shadow, no rounding. Use sparingly to avoid visual chatter.
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center border border-border px-2 py-0.5 text-xs uppercase tracking-wider text-text-muted',
        className,
      )}
      {...props}
    />
  );
});
