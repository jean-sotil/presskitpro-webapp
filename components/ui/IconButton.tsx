import { forwardRef, type ButtonHTMLAttributes, type ReactElement, cloneElement } from 'react';
import { cn } from '@/lib/utils/cn';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required accessible label — naked icons are banned (frontend-design protocol). */
  label: string;
  children: ReactElement;
}

/**
 * Square 44×44 (Fitts's Law) icon button. Wraps the icon child to inject
 * `aria-hidden` since the accessible name comes from `label`.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, children, type = 'button', ...props },
  ref,
) {
  const iconWithAria = cloneElement(children, {
    'aria-hidden': 'true',
    focusable: 'false',
  } as Record<string, string>);

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center bg-transparent text-text border border-border hover:bg-surface transition-colors duration-quick disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] motion-reduce:active:scale-100',
        className,
      )}
      {...props}
    >
      {iconWithAria}
    </button>
  );
});
