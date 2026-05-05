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

export function EditorClient({ initialBundle }: { initialBundle: EditorBundle }) {
  const router = useRouter();
  const qc = useQueryClient();
  const queryKey = useMemo(
    () => ['editor', initialBundle.profile.id] as const,
    [initialBundle.profile.id],
  );

  // ----- Bundle as TanStack cache value (optimistic source of truth) -----
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

  // ----- Section + active selection -----
  const sectionOrder = useMemo<SectionKey[]>(() => {
    const persisted = (bundle.theme?.sectionOrder as Array<{ key: string }> | undefined)?.map(
      (entry) => entry.key as SectionKey,
    );
    return mergeOrder(persisted ?? [...DEFAULT_SECTION_ORDER]);
  }, [bundle.theme]);
  const [active, setActive] = useState<SectionKey>(sectionOrder[0]!);

  // ----- Save status -----
  const [saveState, setSaveState] = useState<SaveStatusState>({
    kind: 'idle',
    lastSavedAt: bundle.profile.updatedAt
      ? new Date(bundle.profile.updatedAt as string).getTime()
      : null,
  });

  // ----- Patch mutation (debounced via autosave) -----
  const patch = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/profiles/${bundle.profile.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `status ${res.status}`);
      }
      return (await res.json()) as { id: number; updatedAt?: string };
    },
    onMutate: () => setSaveState({ kind: 'pending' }),
    onSuccess: (doc) => {
      setSaveState({ kind: 'idle', lastSavedAt: Date.now() });
      qc.setQueryData<EditorBundle>(queryKey, (prev) =>
        prev ? { ...prev, profile: { ...prev.profile, ...doc } } : prev,
      );
    },
    onError: (err: Error) => {
      // Refetch the canonical bundle on error so the optimistic edit doesn't
      // strand the user staring at unsaved data.
      qc.invalidateQueries({ queryKey });
      setSaveState({
        kind: 'error',
        message: err.message,
        onRetry: () => triggerSave(),
      });
    },
  });

  // The set of fields the user edited since the last save. Sent as a single
  // diff when the autosave fires.
  const dirtyRef = useRef<Record<string, unknown>>({});

  function triggerSave() {
    const data = dirtyRef.current;
    if (Object.keys(data).length === 0) return;
    dirtyRef.current = {};
    patch.mutate(data);
  }

  // Stable autosave (created once).
  const autosaveRef = useRef(
    createAutosave({ debounceMs: AUTOSAVE_MS, flush: triggerSave }),
  );
  // triggerSave closes over latest patch / dirtyRef via this ref.
  useEffect(() => {
    autosaveRef.current = createAutosave({
      debounceMs: AUTOSAVE_MS,
      flush: triggerSave,
    });
    // Capture for cleanup so the closed-over autosave can still cancel.
    const captured = autosaveRef.current;
    return () => captured.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush any pending edit when the tab is hidden (PRD AC).
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        autosaveRef.current.flush();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ----- Optimistic edit handlers -----
  function applyOptimistic(patchData: Partial<EditorBundle['profile']>) {
    qc.setQueryData<EditorBundle>(queryKey, (prev) =>
      prev ? { ...prev, profile: { ...prev.profile, ...patchData } } : prev,
    );
  }

  function applyContentOptimistic(patchData: Record<string, unknown>) {
    qc.setQueryData<EditorBundle>(queryKey, (prev) => {
      if (!prev) return prev;
      const baseContent =
        prev.content ?? { id: -1, profile: prev.profile.id };
      return { ...prev, content: { ...baseContent, ...patchData } };
    });
  }

  function onSlugChange(value: string) {
    applyOptimistic({ slug: value });
    dirtyRef.current.slug = value;
    autosaveRef.current.schedule();
  }

  function onTaglineChange(value: string) {
    // Tagline lives on ProfileContent, but the shell mutation only patches
    // Profiles. Until task-11 wires the content-mutation route, the
    // optimistic preview updates while the server-side edit waits — the
    // chassis test still validates the optimistic flow.
    applyContentOptimistic({ tagline: value });
  }

  // ----- Publish/unpublish -----
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
  const tagline = (bundle.content?.tagline as string | undefined) ?? '';

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
        onReorder={(_next) => {
          // Reorder lands in `Themes.sectionOrder`. The Themes-mutation
          // route is task-18 territory; the shell wires the optimistic
          // update only so the preview reflects the new order.
          qc.setQueryData<EditorBundle>(queryKey, (prev) =>
            prev
              ? {
                  ...prev,
                  theme: {
                    ...(prev.theme ?? { id: -1, profile: prev.profile.id }),
                    sectionOrder: _next.map((key) => ({ key })),
                  },
                }
              : prev,
          );
        }}
      />
      <EditorPane
        active={active}
        slug={bundle.profile.slug}
        onSlugChange={onSlugChange}
        tagline={tagline}
        onTaglineChange={onTaglineChange}
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
