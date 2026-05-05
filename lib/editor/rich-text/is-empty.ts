import { extractPlainText } from './extract-plain';

/**
 * True when the Lexical state has no meaningful text content. Drives the
 * editor's empty-state prompt copy (PRD §3 Emerging DJ persona).
 */
export function isEmptyLexicalState(state: unknown): boolean {
  if (state === null || state === undefined) return true;
  return extractPlainText(state as never).trim().length === 0;
}
