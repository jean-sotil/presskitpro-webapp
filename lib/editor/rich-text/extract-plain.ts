/**
 * Walks a Lexical state JSON and returns concatenated plain text.
 * Used for character counters and SEO `metaDescription` fallback (task-20).
 *
 * Block-level boundaries collapse to a single space so the output is
 * suitable for meta tags. For prose-style joining, the renderer handles
 * the nested structure properly — this helper is for terse projections.
 */

type LexicalNode = {
  type?: string;
  text?: string;
  children?: LexicalNode[];
};

type LexicalState = {
  root?: LexicalNode;
};

export function extractPlainText(state: LexicalState | null | undefined): string {
  if (!state || !state.root) return '';
  const parts: string[] = [];
  walk(state.root, parts);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function walk(node: LexicalNode, out: string[]): void {
  if (typeof node.text === 'string' && node.text.length > 0) {
    out.push(node.text);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, out);
    }
  }
}
