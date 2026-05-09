'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

// Lexical pulls a sizeable client bundle. Lazy-loading keeps the editor
// route's initial JS small for sections the user hasn't opened yet.
const BioEditor = dynamic(
  () => import('@/components/editor/rich-text/BioEditor').then((m) => m.BioEditor),
  { ssr: false, loading: () => <BioPlaceholder /> },
);

export interface AboutEditCardProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

export function AboutEditCard({ bundle, onMutate }: AboutEditCardProps) {
  const t = useTranslations('editor.cards.about');
  const tCommon = useTranslations('editor.common');
  const bio = bundle.content?.bio as never;
  const showPrompts = isEmptyLexicalState(bio);
  // next-intl returns array values via `t.raw` — we don't render unsafe HTML
  // here; each item lands in its own <li> as plain text.
  const prompts = (t.raw('prompts') as string[]) ?? [];

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          {tCommon('editingPrefix')} {t('label')}
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          {t('heading')}
        </h2>
      </header>

      {showPrompts ? (
        <div className="border border-dashed border-border bg-bg p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            {t('promptsIntro')}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
            {prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <BioEditor
        initialState={bio ?? null}
        onChange={(state) => onMutate('content', { bio: state })}
        ariaLabel={t('bioAriaLabel')}
      />
    </div>
  );
}

function BioPlaceholder() {
  // BioPlaceholder renders before next-intl's Provider in some lazy-load
  // edge cases, so it stays with a generic role + the public profile's
  // already-loaded fallback string. Worst case: unlocalized "loading…"
  // for a frame; far better than a hook crash inside `dynamic({ssr:false,loading})`.
  return (
    <div
      role="status"
      aria-label="…"
      className="h-56 animate-pulse border border-border bg-bg"
    />
  );
}
