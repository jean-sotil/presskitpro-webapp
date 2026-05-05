import { type ReactNode } from 'react';

export interface StepShellProps {
  step: number;
  total: number;
  title: string;
  helper?: ReactNode;
  children: ReactNode;
}

/**
 * Common chrome for each wizard step: small step indicator, title, helper
 * copy slot, then the step's form.
 */
export function StepShell({ step, total, title, helper, children }: StepShellProps) {
  return (
    <div className="max-w-xl">
      <p
        className="font-display text-xs uppercase tracking-widest text-text-muted"
        aria-label={`Passo ${step} de ${total}`}
      >
        Passo {step} / {total}
      </p>
      <h1 className="mt-3 font-display text-3xl uppercase tracking-tight md:text-4xl">
        {title}
      </h1>
      {helper ? (
        <p className="mt-3 max-w-prose text-sm text-text-muted">{helper}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
