'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { EditorPane } from '@/components/editor/EditorPane';
import { MobileTabs } from '@/components/editor/MobileTabs';
import { PreviewPane } from '@/components/editor/PreviewPane';
import { PublishDialog } from '@/components/editor/PublishDialog';
import { SaveStatus, type SaveStatusState } from '@/components/editor/SaveStatus';
import { SectionRail } from '@/components/editor/SectionRail';

import type { EditorBundle } from '@/lib/editor/bundle';
import { createAutosave } from '@/lib/editor/autosave';
import {
  DEFAULT_SECTION_ORDER,
  mergeOrder,
  type SectionKey,
} from '@/lib/editor/section-order';
import { sectionLabels } from '@/lib/editor/sections';

const AUTOSAVE_MS = 5_000;

/** Which collection a mutation targets. Each scope has its own dirty
 *  buffer + REST route; the autosave flushes all dirty buffers in
 *  parallel. */
export type MutationScope = 'profile' | 'content' | 'theme';

const ROUTE_FOR: Record<MutationScope, (id: number | string) => string> = {
  profile: (id) => `/api/profiles/${id}`,
  content: (id) => `/api/profiles/${id}/content`,
  theme: (id) => `/api/profiles/${id}/theme`,
};

export function EditorClient({ initialBundle }: { initialBundle: EditorBundle }) {
  const router = useRouter();
  const qc = useQueryClient();
  const queryKey = useMemo(
    () => ['editor', initialBundle.profile.id] as const,
    [initialBundle.profile.id],
  );

  const { data: bundle = initialBundle } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${initialBundle.profile.id}/editor-bundle`);
      if (!res.ok) throw new Error(`bundle ${res.status}`);
      return (await res.json()) as EditorBundle;
    },
    initialData: initialBundle,
    staleTime: 30_000,
  });

  const sectionOrder = useMemo<SectionKey[]>(() => {
    const persisted = (bundle.theme?.sectionOrder as Array<{ key: string }> | undefined)?.map(
      (entry) => entry.key as SectionKey,
    );
    return mergeOrder(persisted ?? [...DEFAULT_SECTION_ORDER]);
  }, [bundle.theme]);
  const [active, setActive] = useState<SectionKey>(sectionOrder[0]!);

  const [saveState, setSaveState] = useState<SaveStatusState>({
    kind: 'idle',
    lastSavedAt: bundle.profile.updatedAt
      ? new Date(bundle.profile.updatedAt as string).getTime()
      : null,
  });

  // ----- Triple-buffered dirty state ------------------------------------
  const dirtyProfile = useRef<Record<string, unknown>>({});
  const dirtyContent = useRef<Record<string, unknown>>({});
  const dirtyTheme = useRef<Record<string, unknown>>({});

  function patchScope(
    scope: MutationScope,
    data: Record<string, unknown>,
  ): Promise<Response> {
    return fetch(ROUTE_FOR[scope](bundle.profile.id), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async function triggerSave() {
    const buffers: Array<[MutationScope, Record<string, unknown>]> = [];
    if (Object.keys(dirtyProfile.current).length) {
      buffers.push(['profile', dirtyProfile.current]);
      dirtyProfile.current = {};
    }
    if (Object.keys(dirtyContent.current).length) {
      buffers.push(['content', dirtyContent.current]);
      dirtyContent.current = {};
    }
    if (Object.keys(dirtyTheme.current).length) {
      buffers.push(['theme', dirtyTheme.current]);
      dirtyTheme.current = {};
    }
    if (buffers.length === 0) return;

    setSaveState({ kind: 'pending' });
    try {
      const responses = await Promise.all(
        buffers.map(([scope, data]) => patchScope(scope, data)),
      );
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const body = (await failed.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `status ${failed.status}`);
      }
      setSaveState({ kind: 'idle', lastSavedAt: Date.now() });
      // Invalidate to pull canonical server state into the cache (cheap;
      // bundle endpoint is < 100ms typical).
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      qc.invalidateQueries({ queryKey });
      setSaveState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'save failed',
        onRetry: () => {
          void triggerSave();
        },
      });
    }
  }

  const autosaveRef = useRef(
    createAutosave({ debounceMs: AUTOSAVE_MS, flush: () => void triggerSave() }),
  );
  useEffect(() => {
    autosaveRef.current = createAutosave({
      debounceMs: AUTOSAVE_MS,
      flush: () => void triggerSave(),
    });
    const captured = autosaveRef.current;
    return () => captured.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        autosaveRef.current.flush();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ----- Optimistic + dirty-buffer update -------------------------------
  /**
   * The single mutation entry point used by every EditCard. Updates the
   * TanStack cache for instant preview re-render, appends to the right
   * dirty buffer, and schedules the autosave.
   */
  function applyMutation(scope: MutationScope, patch: Record<string, unknown>) {
    qc.setQueryData<EditorBundle>(queryKey, (prev) => {
      if (!prev) return prev;
      if (scope === 'profile') {
        return { ...prev, profile: { ...prev.profile, ...patch } };
      }
      if (scope === 'content') {
        const baseContent = prev.content ?? { id: -1, profile: prev.profile.id };
        return { ...prev, content: { ...baseContent, ...patch } };
      }
      // theme
      const baseTheme = prev.theme ?? { id: -1, profile: prev.profile.id };
      return { ...prev, theme: { ...baseTheme, ...patch } };
    });
    const buffer =
      scope === 'profile'
        ? dirtyProfile
        : scope === 'content'
        ? dirtyContent
        : dirtyTheme;
    buffer.current = { ...buffer.current, ...patch };
    autosaveRef.current.schedule();
  }

  // ----- Publish/unpublish ---------------------------------------------
  const [dialogIntent, setDialogIntent] = useState<'publish' | 'unpublish' | null>(null);
  const publish = useMutation({
    mutationFn: async (intent: 'publish' | 'unpublish') => {
      const res = await fetch(`/api/profiles/${bundle.profile.id}/${intent}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return (await res.json()) as {
        profile: EditorBundle['profile'];
        publicPath?: string;
      };
    },
    onSuccess: ({ profile, publicPath }, intent) => {
      qc.setQueryData<EditorBundle>(queryKey, (prev) =>
        prev ? { ...prev, profile: { ...prev.profile, ...profile } } : prev,
      );
      setDialogIntent(null);
      if (intent === 'publish' && publicPath) {
        router.refresh();
      }
    },
  });

  const labels = sectionLabels();

  const headerBar = (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-bg px-6 py-4 md:px-12">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-xs uppercase tracking-wider text-text-muted hover:text-text">
          ← Painel
        </Link>
        <p className="font-display text-sm uppercase tracking-wider">
          presskit.pro/{bundle.profile.slug}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <SaveStatus state={saveState} />
        {bundle.profile.status === 'published' ? (
          <Button
            variant="ghost"
            type="button"
            onClick={() => setDialogIntent('unpublish')}
          >
            Despublicar
          </Button>
        ) : (
          <Button type="button" onClick={() => setDialogIntent('publish')}>
            Publicar
          </Button>
        )}
      </div>
    </header>
  );

  const editPaneEl = (
    <div className="flex flex-col gap-6">
      <SectionRail
        order={sectionOrder}
        active={active}
        labels={labels}
        onSelect={setActive}
        onReorder={(next) => {
          applyMutation('theme', {
            sectionOrder: next.map((key) => ({ key })),
          });
        }}
      />
      <EditorPane
        active={active}
        bundle={bundle}
        supabaseUserId={(bundle.profile.owner as unknown as { supabaseUserId?: string })?.supabaseUserId ?? ''}
        onMutate={applyMutation}
      />
    </div>
  );

  const previewPaneEl = <PreviewPane bundle={bundle} />;

  return (
    <>
      {headerBar}
      <div className="hidden md:grid md:grid-cols-[24rem_1fr] md:gap-8 md:px-12 md:py-8">
        {editPaneEl}
        {previewPaneEl}
      </div>
      <div className="md:hidden">
        <MobileTabs panes={{ edit: editPaneEl, preview: previewPaneEl }} />
      </div>
      <PublishDialog
        open={dialogIntent !== null}
        intent={dialogIntent ?? 'publish'}
        slug={bundle.profile.slug}
        pending={publish.isPending}
        onConfirm={() => publish.mutate(dialogIntent!)}
        onClose={() => setDialogIntent(null)}
      />
    </>
  );
}
