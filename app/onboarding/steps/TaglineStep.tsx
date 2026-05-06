'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { advanceStep } from '../actions';

const MAX = 140;

export function TaglineStep({ initial }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  const trimmed = value.trim();
  const remaining = MAX - value.length;
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await advanceStep(3, { taglinePtBR: trimmed });
      if (result.ok) {
        router.push(`/onboarding/${result.nextStep}`);
      } else if ('reason' in result) {
        setError(result.reason);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label htmlFor="tagline" className="text-sm uppercase tracking-wider text-text-muted">
        Sua tagline em PT-BR
      </label>
      <input
        id="tagline"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX}
        className="h-12 border border-border bg-surface px-3 text-base outline-none focus:border-accent"
        aria-describedby="tagline-counter"
        aria-invalid={Boolean(error)}
      />
      <p
        id="tagline-counter"
        className="text-xs text-text-muted"
        aria-live="polite"
      >
        {remaining} caracteres restantes
        {error ? ` · ${error}` : ''}
      </p>
      <div className="mt-4">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Salvando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}
