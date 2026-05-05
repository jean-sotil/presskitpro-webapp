'use client';

import dynamic from 'next/dynamic';

import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

// Lexical pulls a sizeable client bundle. Lazy-loading keeps the editor
// route's initial JS small for sections the user hasn't opened yet.
const BioEditor = dynamic(
  () => import('@/components/editor/rich-text/BioEditor').then((m) => m.BioEditor),
  { ssr: false, loading: () => <BioPlaceholder /> },
);

const PROMPTS = [
  'Como você descreve sua música?',
  'Onde já tocou?',
  'Que projetos definem seu trabalho?',
];

export interface AboutEditCardProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

export function AboutEditCard({ bundle, onMutate }: AboutEditCardProps) {
  const bio = bundle.content?.bio as never;
  const showPrompts = isEmptyLexicalState(bio);

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Sobre
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">Bio</h2>
      </header>

      {showPrompts ? (
        <div className="border border-dashed border-border bg-bg p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Não sabe por onde começar?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
            {PROMPTS.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <BioEditor
        initialState={bio ?? null}
        onChange={(state) => onMutate('content', { bio: state })}
        ariaLabel="Bio em PT-BR"
      />
    </div>
  );
}

function BioPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Carregando editor de bio"
      className="h-56 animate-pulse border border-border bg-bg"
    />
  );
}
