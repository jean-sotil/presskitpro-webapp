'use client';

import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { cn } from '@/lib/utils/cn';

type FormatBtn = {
  label: string;
  onClick: (editor: LexicalEditor) => void;
};

const TEXT_BUTTONS: FormatBtn[] = [
  {
    label: 'B',
    onClick: (editor) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
  },
  {
    label: 'I',
    onClick: (editor) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
  },
];

const HEADING_BUTTONS: Array<{ tag: HeadingTagType; label: string }> = [
  { tag: 'h2', label: 'H2' },
  { tag: 'h3', label: 'H3' },
];

export function Toolbar() {
  const [editor] = useLexicalComposerContext();

  function applyHeading(tag: HeadingTagType) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createHeadingNode(tag));
    });
  }

  function applyParagraph() {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createParagraphNode());
    });
  }

  function insertLink() {
    const url = window.prompt('URL do link');
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }

  return (
    <div role="toolbar" aria-label="Formatação" className="flex flex-wrap gap-1 border-b border-border bg-bg p-2">
      {TEXT_BUTTONS.map((btn) => (
        <ToolbarButton key={btn.label} onClick={() => btn.onClick(editor)}>
          {btn.label}
        </ToolbarButton>
      ))}
      {HEADING_BUTTONS.map((btn) => (
        <ToolbarButton key={btn.tag} onClick={() => applyHeading(btn.tag)}>
          {btn.label}
        </ToolbarButton>
      ))}
      <ToolbarButton onClick={applyParagraph}>P</ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        • Lista
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        1. Lista
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
      >
        ✕ Lista
      </ToolbarButton>
      <ToolbarButton onClick={insertLink}>Link</ToolbarButton>
    </div>
  );
}

function ToolbarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center border border-border bg-transparent px-2 text-xs uppercase tracking-wider text-text hover:bg-surface focus-visible:outline-offset-2',
      )}
    >
      {children}
    </button>
  );
}
