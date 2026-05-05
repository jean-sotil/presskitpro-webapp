'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import type { EditorBundle } from '@/lib/editor/bundle';

export interface FeaturedTrackEditCardProps {
  bundle: EditorBundle;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

type FeaturedTrackRow = {
  id?: number | string;
  url?: string;
  oembedHtml?: string | null;
};

export function FeaturedTrackEditCard({ bundle }: FeaturedTrackEditCardProps) {
  const qc = useQueryClient();
  const profileId = bundle.profile.id;

  const existing = (bundle.featuredTrack as FeaturedTrackRow | null) ?? null;
  const [track, setTrack] = useState<FeaturedTrackRow | null>(existing);
  const [url, setUrl] = useState(existing?.url ?? '');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Re-sync local state when the bundle changes from outside (e.g. a
  // background refetch).
  useEffect(() => {
    setTrack(existing);
    setUrl(existing?.url ?? '');
  }, [existing]);

  const oembedHtml = track?.oembedHtml ?? null;

  async function save(force = false) {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus({ kind: 'pending' });
    try {
      const res = await fetch(`/api/profiles/${profileId}/featured-track`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: trimmed, force }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          reason?: string;
        };
        setStatus({
          kind: 'error',
          message: friendlyReason(body.reason),
        });
        return;
      }
      const body = (await res.json()) as { track?: FeaturedTrackRow };
      if (body.track) {
        setTrack(body.track);
        qc.setQueryData<EditorBundle>(['editor', profileId], (prev) =>
          prev ? { ...prev, featuredTrack: body.track as never } : prev,
        );
      }
      qc.invalidateQueries({ queryKey: ['editor', profileId] });
      setStatus({ kind: 'idle' });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Falha de rede. Tente novamente.',
      });
    }
  }

  async function remove() {
    setStatus({ kind: 'pending' });
    try {
      const res = await fetch(`/api/profiles/${profileId}/featured-track`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setStatus({
          kind: 'error',
          message: 'Não foi possível remover a faixa.',
        });
        return;
      }
      setUrl('');
      setTrack(null);
      qc.setQueryData<EditorBundle>(['editor', profileId], (prev) =>
        prev ? { ...prev, featuredTrack: null } : prev,
      );
      qc.invalidateQueries({ queryKey: ['editor', profileId] });
      setStatus({ kind: 'idle' });
    } catch {
      setStatus({
        kind: 'error',
        message: 'Falha de rede. Tente novamente.',
      });
    }
  }

  const pending = status.kind === 'pending';

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Faixa em destaque
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          Faixa em destaque
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          Cole a URL de uma faixa ou playlist do SoundCloud. O player aparece
          embutido na página pública.
        </p>
      </header>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          URL do SoundCloud
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://soundcloud.com/artista/faixa"
          aria-label="URL do SoundCloud"
          aria-invalid={status.kind === 'error'}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => save(false)} disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
        {oembedHtml ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => save(true)}
              disabled={pending}
            >
              Atualizar embed
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={pending}
            >
              Remover
            </Button>
          </>
        ) : null}
      </div>

      {status.kind === 'error' ? (
        <p role="alert" className="text-sm text-text">
          {status.message}
        </p>
      ) : null}

      {oembedHtml ? (
        <div className="border border-border bg-bg p-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Pré-visualização
          </p>
          {/* The oembedHtml has already been sanitized server-side by
              `extractSafeIframe` — we control the entire string. */}
          <div dangerouslySetInnerHTML={{ __html: oembedHtml }} />
        </div>
      ) : null}
    </div>
  );
}

function friendlyReason(reason: string | undefined): string {
  switch (reason) {
    case 'invalid-url':
      return 'URL inválida. Cole um link completo do SoundCloud.';
    case 'invalid-host':
      return 'Apenas links do soundcloud.com são aceitos.';
    case 'not-found':
      return 'Não encontramos essa faixa (404). Verifique se está pública.';
    case 'upstream-error':
      return 'O SoundCloud retornou um erro. Tente em instantes.';
    case 'malformed-response':
    case 'sanitization-failed':
      return 'Resposta do SoundCloud não pôde ser processada com segurança.';
    case 'timeout':
      return 'A consulta ao SoundCloud demorou demais. Tente novamente.';
    case 'network':
      return 'Falha de rede ao falar com o SoundCloud.';
    default:
      return 'Não foi possível salvar a faixa.';
  }
}
