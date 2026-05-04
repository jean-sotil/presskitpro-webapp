import { Children, cloneElement, isValidElement, type CSSProperties, type ReactNode } from 'react';

export interface RevealStaggerProps {
  children: ReactNode;
}

/**
 * Wraps each child with a `data-reveal` attribute and a `--reveal-index` CSS
 * variable. The actual animation lives in globals.css (scroll-driven `view()`
 * timeline) so the staggered fade-up is GPU-cheap and respects
 * `prefers-reduced-motion` automatically.
 *
 * Children must be React elements (no raw strings) so we can clone props onto
 * them. Anything that isn't an element is rendered as-is.
 */
export function RevealStagger({ children }: RevealStaggerProps) {
  return (
    <>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        const existingProps = child.props as { style?: CSSProperties };
        const mergedStyle: CSSProperties = {
          ...existingProps.style,
          ['--reveal-index' as string]: String(index),
        };

        return cloneElement(child as React.ReactElement<{ style?: CSSProperties; 'data-reveal'?: string }>, {
          'data-reveal': '',
          style: mergedStyle,
        });
      })}
    </>
  );
}
