'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';

export interface PublishDialogProps {
  open: boolean;
  intent: 'publish' | 'unpublish';
  slug: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Lightweight confirmation modal for publish / unpublish. Uses the native
 * `<dialog>` element for built-in focus trap + ESC handling. Adds a
 * scrim and our design-system chrome on top.
 */
export function PublishDialog({
  open,
  intent,
  slug,
  pending,
  onConfirm,
  onClose,
}: PublishDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // The native `<dialog>` close event covers ESC + scrim clicks.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  const title =
    intent === 'publish' ? 'Publicar perfil?' : 'Despublicar perfil?';
  const helper =
    intent === 'publish'
      ? `Seu perfil ficará visível em presskit.pro/${slug}.`
      : 'Visitantes deixarão de encontrar seu perfil. Você pode publicar de novo a qualquer momento.';

  return (
    <dialog
      ref={ref}
      aria-labelledby="publish-dialog-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] border border-border bg-bg p-0 text-text backdrop:bg-bg/80"
    >
      <form method="dialog" className="flex flex-col gap-6 p-6">
        <div>
          <h2
            id="publish-dialog-title"
            className="font-display text-2xl uppercase tracking-tight"
          >
            {title}
          </h2>
          <p className="mt-3 text-sm text-text-muted">{helper}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending
              ? 'Aguarde...'
              : intent === 'publish'
              ? 'Publicar'
              : 'Despublicar'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
