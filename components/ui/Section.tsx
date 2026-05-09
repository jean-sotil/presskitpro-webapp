import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export type SectionProps = HTMLAttributes<HTMLElement>;

/**
 * Semantic <section> with vertical rhythm consistent across the public profile
 * and the editor preview. Use with <SectionMarker /> for numbered headings.
 */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { className, children, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn('mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-12 md:py-24', className)}
      {...props}
    >
      {children}
    </section>
  );
});
