'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { CURATED_SERVICES } from '@/lib/onboarding/state';
import { advanceStep } from '../actions';

const MAX_CUSTOM = 3;

export interface ServicesStepProps {
  initialSelected?: string[];
  initialCustom?: string[];
}

export function ServicesStep({
  initialSelected = [],
  initialCustom = [],
}: ServicesStepProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [customs, setCustoms] = useState<string[]>(initialCustom);
  const [draft, setDraft] = useState('');
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function addCustom() {
    const v = draft.trim();
    if (!v) return;
    if (customs.includes(v) || CURATED_SERVICES.includes(v as never)) return;
    if (customs.length >= MAX_CUSTOM) {
      setError(`Máximo ${MAX_CUSTOM} customizados.`);
      return;
    }
    setCustoms((prev) => [...prev, v]);
    setSelected((prev) => [...prev, v]);
    setDraft('');
    setError(null);
  }

  function removeCustom(v: string) {
    setCustoms((prev) => prev.filter((x) => x !== v));
    setSelected((prev) => prev.filter((x) => x !== v));
  }

  const canSubmit = selected.length > 0 && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await advanceStep(4, {
        services: selected,
        customServices: customs,
      });
      if (result.ok) {
        router.push(`/onboarding/${result.nextStep}`);
      } else if ('reason' in result) {
        setError(result.reason);
      }
    });
  }

  const all = [...CURATED_SERVICES, ...customs];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-sm uppercase tracking-wider text-text-muted">
          Quais serviços você oferece?
        </legend>
        <div role="group" className="mt-3 flex flex-wrap gap-2">
          {all.map((service) => {
            const checked = selected.includes(service);
            const isCustom = customs.includes(service);
            return (
              <label
                key={service}
                className={`inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-border bg-transparent text-text hover:bg-surface'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(service)}
                  className="sr-only"
                />
                <span>{service}</span>
                {isCustom ? (
                  <button
                    type="button"
                    onClick={() => removeCustom(service)}
                    aria-label={`Remover ${service}`}
                    className="ml-1 text-xs underline underline-offset-2"
                  >
                    ×
                  </button>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            Adicionar outro
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="ex. Vinyl-only sets"
            className="h-10 border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
            disabled={customs.length >= MAX_CUSTOM}
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          onClick={addCustom}
          disabled={customs.length >= MAX_CUSTOM || !draft.trim()}
        >
          + Adicionar
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-text-muted">
          {error}
        </p>
      ) : null}

      <div className="mt-2">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Salvando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}
