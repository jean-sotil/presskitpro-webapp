'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import type { EditorBundle } from '@/lib/editor/bundle';

const MAX_POSTS = 6;
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type Slot = {
  id?: number;
  url: string;
  oembedHtml?: string | null;
  fetchedAt?: string | null;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

export interface InstagramPostsEditCardProps {
  bundle: EditorBundle;
}

function snapshotFromBundle(bundle: EditorBundle): Slot[] {
  const posts = (bundle.instagramPosts ?? []) as unknown as Array<{
    id: number;
    url: string;
    oembedHtml?: string | null;
    fetchedAt?: string | null;
    displayOrder?: number;
  }>;
  return [...posts]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((p) => ({
      id: p.id,
      url: p.url ?? '',
      oembedHtml: p.oembedHtml ?? null,
      fetchedAt: p.fetchedAt ?? null,
    }));
}

export function InstagramPostsEditCard({
  bundle,
}: InstagramPostsEditCardProps) {
  const qc = useQueryClient();
  const profileId = bundle.profile.id;
  const [slots, setSlots] = useState<Slot[]>(() => snapshotFromBundle(bundle));
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Re-sync when the bundle is replaced (e.g. background refetch after save).
  useEffect(() => {
    setSlots(snapshotFromBundle(bundle));
  }, [bundle]);

  const pending = status.kind === 'pending';

  function setSlotAt(index: number, value: Slot) {
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function removeAt(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function addSlot() {
    setSlots((prev) => (prev.length >= MAX_POSTS ? prev : [...prev, { url: '' }]));
  }

  async function save(force = false, only?: number) {
    setStatus({ kind: 'pending' });
    const payloadPosts = slots
      .filter((s) => s.url.trim().length > 0)
      .map((s) => (s.id ? { id: s.id, url: s.url } : { url: s.url }));
    try {
      const res = await fetch(`/api/profiles/${profileId}/instagram-posts`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ posts: payloadPosts, force }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          reason?: string;
          index?: number;
        };
        setStatus({
          kind: 'error',
          message: friendlyError(body.reason, body.index),
        });
        return;
      }
      const body = (await res.json()) as {
        posts: Array<{
          id: number;
          url: string;
          oembedHtml?: string | null;
          fetchedAt?: string | null;
        }>;
      };
      setSlots(
        body.posts.map((p) => ({
          id: p.id,
          url: p.url,
          oembedHtml: p.oembedHtml ?? null,
          fetchedAt: p.fetchedAt ?? null,
        })),
      );
      qc.invalidateQueries({ queryKey: ['editor', profileId] });
      setStatus({ kind: 'idle' });
      // Quiet `only` so TS doesn't whine — kept on the signature for
      // future per-row force without a refactor.
      void only;
    } catch {
      setStatus({
        kind: 'error',
        message: 'Falha de rede. Tente novamente.',
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Instagram
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          Instagram
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          Cole até {MAX_POSTS} URLs de posts/reels. Atualize mensalmente —
          o Instagram troca os tokens dos embeds e posts antigos podem deixar
          de carregar.
        </p>
      </header>

      {slots.length === 0 ? (
        <p className="border border-dashed border-border p-4 text-sm text-text-muted">
          Nenhum post adicionado. Clique em &ldquo;Adicionar post&rdquo; para começar.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {slots.map((slot, i) => {
            const stale =
              slot.fetchedAt &&
              Date.now() - new Date(slot.fetchedAt).getTime() > STALE_AFTER_MS;
            return (
              <li
                key={`${slot.id ?? 'new'}-${i}`}
                className="flex flex-col gap-2 border border-border bg-bg p-3"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-text-muted">
                    URL do post #{i + 1}
                  </span>
                  <input
                    type="url"
                    value={slot.url}
                    onChange={(e) =>
                      setSlotAt(i, { ...slot, url: e.target.value })
                    }
                    placeholder="https://www.instagram.com/p/CxYzAbc123/"
                    aria-label={`URL do post #${i + 1}`}
                    className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {slot.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => save(true, i)}
                      disabled={pending}
                    >
                      Atualizar
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeAt(i)}
                    disabled={pending}
                  >
                    Remover
                  </Button>
                  {stale ? (
                    <span className="text-xs text-text-muted">
                      Recomendado atualizar (último embed &gt; 7 dias).
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => save(false)} disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={addSlot}
          disabled={pending || slots.length >= MAX_POSTS}
        >
          + Adicionar post
        </Button>
      </div>

      {status.kind === 'error' ? (
        <p role="alert" className="text-sm text-text">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

function friendlyError(reason: string | undefined, index: number | undefined): string {
  const slot =
    typeof index === 'number' ? `Post #${index + 1}: ` : '';
  switch (reason) {
    case 'wrong-host':
      return `${slot}apenas links do instagram.com são aceitos.`;
    case 'invalid-url':
      return `${slot}URL inválida.`;
    case 'invalid-path':
      return `${slot}use o link de um post (`;
    case 'too-many':
      return `Limite de ${MAX_POSTS} posts atingido.`;
    case 'empty':
      return `${slot}URL está em branco.`;
    case 'missing-url':
      return `${slot}preencha a URL antes de salvar.`;
    default:
      return 'Não foi possível salvar os posts.';
  }
}
