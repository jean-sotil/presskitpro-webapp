import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Marks the link as external — applies `target="_blank"` and the
   * `noopener noreferrer` rel safety pair (CSP / tab-nabbing defense).
   */
  external?: boolean;
}

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(function Anchor(
  { className, external, rel, target, children, ...props },
  ref,
) {
  const safeTarget = external ? '_blank' : target;
  const safeRel = external ? `${rel ? rel + ' ' : ''}noopener noreferrer`.trim() : rel;

  return (
    <a
      ref={ref}
      target={safeTarget}
      rel={safeRel}
      className={cn(
        'text-accent underline underline-offset-4 hover:underline-offset-2 transition-[text-underline-offset] duration-quick',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
});
