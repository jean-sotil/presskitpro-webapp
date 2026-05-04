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
      className={cn('py-16 md:py-24 px-6 md:px-12 max-w-screen-2xl mx-auto w-full', className)}
      {...props}
    >
      {children}
    </section>
  );
});
