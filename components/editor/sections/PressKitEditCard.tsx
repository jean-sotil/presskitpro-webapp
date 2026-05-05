'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';
import type { ValidateResult } from '@/lib/server/press-kit-validate';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

const PROVIDER_LABELS: Record<PressKitProvider, string> = {
  unknown: 'Desconhecido',
  'google-drive': 'Google Drive',
  dropbox: 'Dropbox',
  onedrive: 'OneDrive',
  wetransfer: 'WeTransfer',
  notion: 'Notion',
  mediafire: 'MediaFire',
  other: 'Outro',
};

type Status =
  | { kind: 'idle' }
  | { kind: 'validating' }
  | { kind: 'valid'; provider: PressKitProvider; warning?: 'restrictive-access' }
  | { kind: 'invalid'; message: string };

export interface PressKitEditCardProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

type ProfileWithPressKit = EditorBundle['profile'] & {
  pressKitUrl?: string;
  pressKitProvider?: PressKitProvider;
};

export function PressKitEditCard({ bundle, onMutate }: PressKitEditCardProps) {
  const profile = bundle.profile as ProfileWithPressKit;
  const savedUrl = profile.pressKitUrl ?? '';
  const savedProvider = (profile.pressKitProvider ?? 'unknown') as PressKitProvider;

  const [url, setUrl] = useState(savedUrl);
  const [status, setStatus] = useState<Status>(
    savedUrl
      ? { kind: 'valid', provider: savedProvider }
      : { kind: 'idle' },
  );

  // Re-sync local state if the bundle changes from outside (e.g. after a
  // failed autosave invalidates the query and refetches).
  useEffect(() => {
    setUrl(savedUrl);
    setStatus(
      savedUrl
        ? { kind: 'valid', provider: savedProvider }
        : { kind: 'idle' },
    );
  }, [savedUrl, savedProvider]);

  async function validate() {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus({ kind: 'idle' });
      onMutate('profile', { pressKitUrl: '' });
      return;
    }
    setStatus({ kind: 'validating' });
    try {
      const res = await fetch('/api/press-kit-validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const result = (await res.json()) as ValidateResult;
      if (result.ok) {
        setStatus({
          kind: 'valid',
          provider: result.provider,
          warning: result.warning,
        });
        onMutate('profile', { pressKitUrl: trimmed });
        return;
      }
      setStatus({ kind: 'invalid', message: friendlyReason(result.reason) });
    } catch {
      setStatus({
        kind: 'invalid',
        message: 'Não foi possível validar a URL. Tente novamente.',
      });
    }
  }

  function clear() {
    setUrl('');
    setStatus({ kind: 'idle' });
    onMutate('profile', { pressKitUrl: '' });
  }

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Press kit
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          Press kit
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          Cole o link do seu press kit hospedado no Google Drive, Dropbox,
          Notion etc. Verifique se está público — não restrito ao seu workspace.
        </p>
      </header>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          URL do press kit
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/.../view"
          aria-invalid={status.kind === 'invalid'}
          aria-label="URL do press kit"
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={validate}
          disabled={status.kind === 'validating'}
        >
          {status.kind === 'validating' ? 'Validando...' : 'Validar'}
        </Button>
        {savedUrl ? (
          <Button type="button" variant="ghost" onClick={clear}>
            Limpar
          </Button>
        ) : null}
      </div>

      {status.kind === 'valid' ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span aria-hidden="true">✓</span>
          <span>Link válido — {PROVIDER_LABELS[status.provider]}</span>
          {status.warning === 'restrictive-access' ? (
            <span className="ml-2 border border-border bg-bg px-2 py-1 text-xs text-text-muted">
              Pode estar restrito a usuários do workspace. Confirme abrindo o
              link em uma janela anônima.
            </span>
          ) : null}
        </div>
      ) : null}

      {status.kind === 'invalid' ? (
        <p role="alert" className="text-sm text-text">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

function friendlyReason(reason: string): string {
  switch (reason) {
    case 'invalid-url':
      return 'URL inválida. Cole um link completo, começando com https://';
    case 'not-found':
      return 'Não encontramos esse arquivo (HTTP 404). Verifique o link.';
    case 'server-error':
      return 'O servidor do press kit retornou um erro. Tente novamente em instantes.';
    case 'timeout':
      return 'A validação demorou demais. O servidor pode estar fora do ar.';
    case 'unreachable':
      return 'Não conseguimos acessar essa URL. Verifique se está online.';
    default:
      return 'Não foi possível validar a URL.';
  }
}
