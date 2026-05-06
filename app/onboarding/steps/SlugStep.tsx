'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { advanceStep } from '../actions';
import { validateSlugFormat } from '@/lib/slug/format';

type CheckResult =
  | { available: true }
  | { available: false; reason: string };

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'error'; message: string };

export interface SlugStepProps {
  initialSlug?: string;
  /** Debounce delay before calling /api/slug/check. Tests pass 0. */
  debounceMs?: number;
}

export function SlugStep({ initialSlug, debounceMs = 300 }: SlugStepProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug ?? '');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [submitting, startTransition] = useTransition();

  // Debounced availability check (300ms — matches PRD §6.2 expectation).
  useEffect(() => {
    if (!slug) {
      setStatus({ kind: 'idle' });
      return;
    }
    const fmt = validateSlugFormat(slug);
    if (!fmt.ok) {
      setStatus({ kind: 'unavailable', reason: fmt.reason });
      return;
    }
    setStatus({ kind: 'checking' });
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/slug/check?slug=${encodeURIComponent(slug)}`,
        );
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}${text ? ` — ${text.slice(0, 200)}` : ''}`);
        }
        const body = (await res.json()) as CheckResult;
        if (body.available) {
          setStatus({ kind: 'available' });
        } else {
          setStatus({ kind: 'unavailable', reason: body.reason });
        }
      } catch (err) {
        // Surface the underlying error in dev so we can debug; production
        // shows the generic "Erro de rede" copy.
        console.error('[slug-check]', err);
        setStatus({
          kind: 'error',
          message: err instanceof Error ? err.message : 'check failed',
        });
      }
    }, debounceMs);
    return () => clearTimeout(id);
  }, [slug, debounceMs]);

  const isReady = status.kind === 'available' && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isReady) return;
    startTransition(async () => {
      const result = await advanceStep(1, { slug });
      if (result.ok) {
        router.push(`/onboarding/${result.nextStep}`);
      } else if (result.reason === 'reservation-failed') {
        setStatus({ kind: 'unavailable', reason: 'taken' });
      } else if ('reason' in result) {
        setStatus({ kind: 'error', message: result.reason });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label htmlFor="slug" className="text-sm uppercase tracking-wider text-text-muted">
        URL pública
      </label>
      <div className="flex items-center border border-border bg-surface focus-within:border-accent">
        <span aria-hidden="true" className="px-3 text-sm text-text-muted">
          presskit.pro/
        </span>
        <input
          id="slug"
          name="slug"
          autoComplete="off"
          inputMode="url"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          className="h-12 flex-1 bg-transparent pr-3 text-base outline-none placeholder:text-text-muted/60"
          aria-describedby="slug-hint"
          aria-invalid={status.kind === 'unavailable' || status.kind === 'error'}
        />
      </div>
      <p
        id="slug-hint"
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-sm"
      >
        {status.kind === 'idle' && 'Letras minúsculas, números e hífens. 2 a 30 caracteres.'}
        {status.kind === 'checking' && 'Verificando...'}
        {status.kind === 'available' && (
          <span className="text-accent">Disponível ✓</span>
        )}
        {status.kind === 'unavailable' && (
          <span className="text-text-muted">{labelFor(status.reason)}</span>
        )}
        {status.kind === 'error' && (
          <span className="text-text-muted">
            {process.env.NODE_ENV === 'production'
              ? 'Erro de rede. Tenta de novo.'
              : `Erro: ${status.message}`}
          </span>
        )}
      </p>
      <div className="mt-4">
        <Button type="submit" disabled={!isReady}>
          {submitting ? 'Salvando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}

function labelFor(reason: string): string {
  switch (reason) {
    case 'too-short':   return 'Muito curto (mínimo 2 caracteres).';
    case 'too-long':    return 'Muito longo (máximo 30 caracteres).';
    case 'invalid-chars': return 'Use apenas letras minúsculas, números e hífens.';
    case 'reserved':    return 'Esta URL é reservada.';
    case 'profane':     return 'Esta URL não é permitida.';
    case 'taken':       return 'Esta URL já está em uso.';
    default:            return 'Indisponível.';
  }
}
