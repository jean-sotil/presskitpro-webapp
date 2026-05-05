'use client';

import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode } from '@lexical/rich-text';
import {
  type EditorState,
  type SerializedEditorState,
} from 'lexical';
import { useRef } from 'react';

import { PastePlugin } from './PastePlugin';
import { Toolbar } from './Toolbar';

const NODES = [HeadingNode, ListNode, ListItemNode, LinkNode];

const THEME = {
  paragraph: 'mb-3 leading-relaxed',
  heading: {
    h2: 'mt-6 mb-3 font-display text-2xl uppercase tracking-tight',
    h3: 'mt-5 mb-2 font-display text-lg uppercase tracking-wide',
  },
  list: {
    nested: { listitem: 'list-none' },
    ol: 'list-decimal pl-6',
    ul: 'list-disc pl-6',
    listitem: 'mb-1',
  },
  link: 'underline underline-offset-4',
  text: {
    bold: 'font-semibold',
    italic: 'italic',
    underline: 'underline underline-offset-2',
  },
};

export interface BioEditorProps {
  /** Initial Lexical state JSON. `null` means start with an empty document. */
  initialState: SerializedEditorState | null | undefined;
  onChange: (state: SerializedEditorState) => void;
  ariaLabel?: string;
}

export function BioEditor({ initialState, onChange, ariaLabel }: BioEditorProps) {
  // Lexical's `editorState` config accepts a serialized state JSON string OR
  // a function that takes the editor + a parser. We pass a parser callback
  // so the editor hydrates from saved state on mount.
  const initialConfig = {
    namespace: 'bio',
    nodes: NODES,
    theme: THEME,
    onError: (error: Error) => {
      // Surface in dev; production deliberately swallows so the editor
      // doesn't crash the dashboard on a single corrupt state.
      // eslint-disable-next-line no-console
      console.error('[Lexical]', error);
    },
    editorState:
      initialState !== null && initialState !== undefined
        ? JSON.stringify(initialState)
        : null,
  };

  const lastSerialized = useRef<string | null>(
    initialState ? JSON.stringify(initialState) : null,
  );

  function handleChange(editorState: EditorState) {
    editorState.read(() => {
      const json = JSON.stringify(editorState.toJSON());
      if (json === lastSerialized.current) return;
      lastSerialized.current = json;
      onChange(editorState.toJSON());
    });
  }

  return (
    <div className="border border-border bg-bg">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={ariaLabel ?? 'Editor de bio'}
                className="min-h-[14rem] p-4 outline-none focus:outline-none"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute left-4 top-4 text-text-muted">
                Escreva sua bio...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <PastePlugin />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}
