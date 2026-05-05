'use client';

import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { sanitizePastedHtml } from '@/lib/editor/rich-text/sanitize-paste';

/**
 * Intercepts the editor's paste command. When the clipboard carries
 * HTML, we sanitize it (strip styles/classes/Word/GDocs cruft) before
 * Lexical imports the nodes. Plain-text pastes fall through to Lexical's
 * default handler.
 */
export function PastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const html = event.clipboardData?.getData('text/html');
        if (!html) return false;

        event.preventDefault();
        const cleaned = sanitizePastedHtml(html);
        editor.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(cleaned, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodes);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}
