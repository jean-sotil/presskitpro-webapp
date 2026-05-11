'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { MobileTabs, type MobileTab } from '@/components/editor/MobileTabs';
import { PreviewPane } from '@/components/editor/PreviewPane';
import { PublishDialog } from '@/components/editor/PublishDialog';
import { SaveStatus, type SaveStatusState } from '@/components/editor/SaveStatus';
import { ThemeTab } from '@/components/editor/ThemeTab';
import { BlocksTab } from '@/components/editor/BlocksTab';
import { PresetsTab } from './PresetsTab';

import type { EditorBundle } from '@/lib/editor/bundle';
import { createAutosave } from '@/lib/editor/autosave';
import { DEFAULT_SECTION_ORDER, mergeOrder, type SectionKey } from '@/lib/editor/section-order';
import { sectionLabels } from '@/lib/editor/sections';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const AUTOSAVE_MS = 5_000;

/** Which collection a mutation targets. Each scope has its own dirty
 *  buffer + REST route; the autosave flushes all dirty buffers in
 *  parallel. */
export type MutationScope = 'profile' | 'content' | 'theme' | 'socialLinks';

const ROUTE_FOR: Record<MutationScope, (id: number | string) => string> = {
  profile: (id) => `/api/profiles/${id}`,
  content: (id) => `/api/profiles/${id}/content`,
  theme: (id) => `/api/profiles/${id}/theme`,
  socialLinks: (id) => `/api/profiles/${id}/social-links`,
};

const METHOD_FOR: Record<MutationScope, 'PATCH' | 'PUT'> = {
  profile: 'PATCH',
  content: 'PATCH',
  theme: 'PATCH',
  socialLinks: 'PUT',
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
  
  const [active, setActive] = useState<SectionKey | null>(sectionOrder[0]!);
  const [editorTab, setEditorTab] = useState<'sections' | 'theme' | 'design'>('sections');
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit');
  
  const tTabs = useTranslations('editor.tabs');
  const tDesign = useTranslations('editor.design');

  const [saveState, setSaveState] = useState<SaveStatusState>({
    kind: 'idle',
    lastSavedAt: bundle.profile.updatedAt
      ? new Date(bundle.profile.updatedAt as string).getTime()
      : null,
  });

  // ----- Per-scope dirty buffers ----------------------------------------
  const dirtyProfile = useRef<Record<string, unknown>>({});
  const dirtyContent = useRef<Record<string, unknown>>({});
  const dirtyTheme = useRef<Record<string, unknown>>({});
  const dirtySocialLinks = useRef<Record<string, unknown>>({});

  function patchScope(scope: MutationScope, data: Record<string, unknown>): Promise<Response> {
    return fetch(ROUTE_FOR[scope](bundle.profile.id), {
      method: METHOD_FOR[scope],
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
    if (Object.keys(dirtySocialLinks.current).length) {
      buffers.push(['socialLinks', dirtySocialLinks.current]);
      dirtySocialLinks.current = {};
    }
    if (buffers.length === 0) return;

    setSaveState({ kind: 'pending' });
    try {
      const responses = await Promise.all(buffers.map(([scope, data]) => patchScope(scope, data)));
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        const body = (await failed.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `status ${failed.status}`);
      }
      setSaveState({ kind: 'idle', lastSavedAt: Date.now() });
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
      if (scope === 'theme') {
        const baseTheme = prev.theme ?? { id: -1, profile: prev.profile.id };
        return { ...prev, theme: { ...baseTheme, ...patch } };
      }
      const incoming = (patch.links as EditorBundle['socialLinks'] | undefined) ?? [];
      return { ...prev, socialLinks: incoming };
    });
    const buffer =
      scope === 'profile'
        ? dirtyProfile
        : scope === 'content'
          ? dirtyContent
          : scope === 'theme'
            ? dirtyTheme
            : dirtySocialLinks;
    buffer.current = { ...buffer.current, ...patch };
    autosaveRef.current.schedule();
  }

  // ----- Publish/unpublish ---------------------------------------------
  const [dialogIntent, setDialogIntent] = useState<'publish' | 'unpublish' | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const publish = useMutation({
    mutationFn: async (intent: 'publish' | 'unpublish') => {
      const res = await fetch(`/api/profiles/${bundle.profile.id}/${intent}`, {
        method: 'POST',
      });
      if (res.status === 422) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'contrast-stale');
      }
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
      setPublishError(null);
      if (intent === 'publish' && publicPath) {
        router.refresh();
      }
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'contrast-stale') {
        setPublishError(
          'O tema precisa ser revalidado (contraste WCAG) antes de publicar. Abra a aba Tema e clique em "Validar contraste".',
        );
      } else {
        setPublishError('Não foi possível publicar. Tente novamente.');
      }
    },
  });

  const labels = sectionLabels();

  // ----- Task 36 Phase 1: Sticky Shell ----------------------------------
  
  const topBar = (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-surface px-6 md:px-12 py-4">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Dashboard
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-xs font-medium text-text">
          {bundle.profile.slug}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className={cn(
          "hidden sm:block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold",
          bundle.profile.status === 'published' ? "bg-green-600/20 text-green-600" : "bg-yellow-600/20 text-yellow-600"
        )}>
          {bundle.profile.status === 'published' ? 'Published' : 'Draft'}
        </div>

        <Button
          type="button"
          onClick={() => setDialogIntent(bundle.profile.status === 'published' ? 'unpublish' : 'publish')}
          disabled={publish.isPending}
          className={cn(
            "h-8 rounded-md px-4 text-xs font-medium transition-colors",
            "bg-accent text-accent-contrast",
            "hover:opacity-90",
            "disabled:opacity-50"
          )}
        >
          {publish.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : bundle.profile.status === 'published' ? (
            'Despublicar'
          ) : (
            'Publicar'
          )}
        </Button>
      </div>
    </header>
  );

  const tabStrip = (
    <div 
      role="tablist" 
      className="sticky top-[48px] z-10 flex h-10 border-b border-border bg-bg"
      aria-label={tTabs('ariaLabel')}
    >
      <TabButton
        active={editorTab === 'sections'}
        onClick={() => setEditorTab('sections')}
        label="SECTIONS"
      />
      <TabButton
        active={editorTab === 'theme'}
        onClick={() => setEditorTab('theme')}
        label="THEME"
      />
      <TabButton
        active={editorTab === 'design'}
        onClick={() => setEditorTab('design')}
        label="PRESETS"
      />
    </div>
  );

  const bottomBar = (
    <footer className="sticky bottom-0 z-10 flex h-16 items-center justify-between border-t border-border bg-surface px-4 py-3 md:px-6">
      <div className="flex items-center gap-4">
        <SaveStatus state={saveState} />
      </div>
      
      <button
        type="button"
        onClick={() => setMobileTab(mobileTab === 'edit' ? 'preview' : 'edit')}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors md:hidden"
      >
        {mobileTab === 'edit' ? (
          <>
            <ChevronLeft className="h-3 w-3" />
            Preview
          </>
        ) : (
          <>
            Editor
            <ChevronRight className="h-3 w-3" />
          </>
        )}
      </button>
    </footer>
  );

  const editPaneEl = (
    <div className="flex flex-col h-full border-r border-border bg-surface">
      {topBar}
      {tabStrip}
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        {editorTab === 'sections' ? (
          <BlocksTab
            active={active}
            order={sectionOrder}
            bundle={bundle}
            supabaseUserId={
              (bundle.profile.owner as unknown as { supabaseUserId?: string })?.supabaseUserId ?? ''
            }
            onSelect={setActive}
            onReorder={(next) => {
              applyMutation('theme', {
                sectionOrder: next.map((key) => ({ key })),
              });
            }}
            onMutate={applyMutation}
          />
        ) : editorTab === 'theme' ? (
          <ThemeTab bundle={bundle} onMutate={applyMutation} />
        ) : (
          <PresetsTab
            profileId={Number(bundle.profile.id)}
            profileSlug={String(bundle.profile.slug ?? '')}
            activePresetId={(bundle.theme as { presetId?: string | null } | null)?.presetId ?? null}
          />
        )}
      </div>

      {bottomBar}
    </div>
  );

  const previewPaneEl = <PreviewPane bundle={bundle} />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
      {/* Desktop Layout */}
      <div className="hidden flex-1 min-h-0 md:flex md:overflow-hidden">
        <div className="flex h-full w-[300px] shrink-0 flex-col min-h-0">
          {editPaneEl}
        </div>
        <div className="flex-1 h-full min-w-0 overflow-y-auto bg-black/20 p-8 pb-32">
           <div className="mx-auto max-w-[1000px]">
             {previewPaneEl}
           </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="flex-1 min-h-0 overflow-hidden md:hidden">
        <MobileTabs 
          active={mobileTab} 
          onChange={setMobileTab}
          panes={{ edit: editPaneEl, preview: previewPaneEl }} 
        />
      </div>

      <PublishDialog
        open={dialogIntent !== null}
        intent={dialogIntent ?? 'publish'}
        slug={bundle.profile.slug}
        pending={publish.isPending}
        onConfirm={() => publish.mutate(dialogIntent!)}
        onClose={() => {
          setDialogIntent(null);
          setPublishError(null);
        }}
      />
      
      {publishError ? (
        <div
          role="alert"
          className="fixed bottom-20 right-4 z-50 max-w-sm border border-border bg-bg p-3 text-sm text-text shadow-xl"
        >
          {publishError}
          <button
            type="button"
            onClick={() => setPublishError(null)}
            className="ml-2 text-accent underline"
          >
            Fechar
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string 
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center px-3 py-2 text-xs font-medium uppercase tracking-wider transition-all",
        active 
          ? "border-b-2 border-accent text-accent" 
          : "text-text-muted hover:text-text"
      )}
    >
      {label}
    </button>
  );
}
