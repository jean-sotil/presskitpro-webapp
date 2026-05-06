import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { WizardStep } from '@/lib/onboarding/state';

type Status = 'done' | 'current' | 'locked';

const LABELS: Record<WizardStep, string> = {
  1: 'URL',
  2: 'Imagens',
  3: 'Tagline',
  4: 'Serviços',
  5: 'Redes sociais',
};

export interface StepRailProps {
  /** The currently-rendered step (1..5). */
  current: WizardStep;
  /** The highest step the user has completed. Steps ≤ this are clickable. */
  highestCompleted: number;
}

/**
 * Vertical step indicator. Completed steps are anchors so the user can
 * back-edit; future steps are visually disabled and not focusable.
 */
export function StepRail({ current, highestCompleted }: StepRailProps) {
  const steps: WizardStep[] = [1, 2, 3, 4, 5];

  return (
    <nav aria-label="Progresso do onboarding" className="hidden md:block">
      <ol className="flex flex-col gap-3 text-sm">
        {steps.map((step) => {
          const status: Status =
            step === current ? 'current' : step <= highestCompleted ? 'done' : 'locked';
          const inner = (
            <span
              className={cn(
                'flex items-center gap-3 px-4 py-3 border transition-colors duration-quick',
                status === 'current' && 'border-accent bg-surface text-text',
                status === 'done' && 'border-border text-text-muted hover:text-text',
                status === 'locked' && 'border-border text-text-muted/50',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-7 w-7 items-center justify-center font-display text-xs',
                  status === 'current'
                    ? 'bg-accent text-accent-contrast'
                    : 'border border-border',
                )}
              >
                {step}
              </span>
              <span className="uppercase tracking-wider">{LABELS[step]}</span>
            </span>
          );
          if (status === 'done' || status === 'current') {
            return (
              <li key={step}>
                <Link
                  href={`/onboarding/${step}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                  className="block focus-visible:outline-offset-2"
                >
                  {inner}
                </Link>
              </li>
            );
          }
          // Locked future steps: not a link. Screen readers naturally
          // announce them as plain list items; `aria-disabled` is not a
          // valid attribute on `role="listitem"` so the visual style is
          // the only "disabled" cue.
          return <li key={step}>{inner}</li>;
        })}
      </ol>
    </nav>
  );
}
