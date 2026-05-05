import { Fragment, type ReactNode } from 'react';

/**
 * Server-renders Lexical state JSON without importing Lexical itself —
 * keeps the public route's bundle lean (task-19 Lighthouse target).
 *
 * Supported nodes: paragraph, heading (h2/h3), list (bullet/number) +
 * listitem, link, text with format flags (bold/italic), linebreak.
 *
 * Anything outside the allowlist renders its children unchanged
 * (forward-compatibility for nodes we add later).
 */

type LexicalRoot = {
  root?: LexicalNode | null;
};

type LexicalNode = {
  type?: string;
  // Paragraph / heading / lists / links: have children + sometimes attrs.
  children?: LexicalNode[];
  // Heading.
  tag?: string;
  // List.
  listType?: 'bullet' | 'number' | 'check';
  // Link.
  url?: string;
  rel?: string;
  target?: string;
  // Text.
  text?: string;
  format?: number; // bitfield: 1=bold, 2=italic, 4=strikethrough, 8=underline, ...
};

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 1 << 1;
const FORMAT_UNDERLINE = 1 << 3;

export interface RichTextRenderProps {
  state: LexicalRoot | null | undefined;
  /** Optional className applied to the wrapping container. */
  className?: string;
}

export function RichTextRender({ state, className }: RichTextRenderProps) {
  if (!state || !state.root) return null;
  const root = state.root;
  if (!root.children || root.children.length === 0) return null;
  return (
    <div className={className}>{root.children.map((child, i) => renderNode(child, `r-${i}`))}</div>
  );
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{renderChildren(node)}</p>;

    case 'heading': {
      const Tag = node.tag === 'h3' ? 'h3' : 'h2';
      return <Tag key={key}>{renderChildren(node)}</Tag>;
    }

    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul';
      return <Tag key={key}>{renderChildren(node)}</Tag>;
    }

    case 'listitem':
      return <li key={key}>{renderChildren(node)}</li>;

    case 'link':
      return (
        <a
          key={key}
          href={node.url ?? '#'}
          target={node.target ?? undefined}
          rel={node.rel ?? 'noopener noreferrer'}
        >
          {renderChildren(node)}
        </a>
      );

    case 'linebreak':
      return <br key={key} />;

    case 'text':
      return renderText(node, key);

    default:
      // Forward-compat: surface unknown node's children if any.
      if (node.children && node.children.length > 0) {
        return <Fragment key={key}>{renderChildren(node)}</Fragment>;
      }
      return null;
  }
}

function renderChildren(node: LexicalNode): ReactNode {
  if (!node.children) return null;
  return node.children.map((child, i) => renderNode(child, `c-${i}`));
}

function renderText(node: LexicalNode, key: string): ReactNode {
  const text = node.text ?? '';
  const format = node.format ?? 0;
  let content: ReactNode = text;
  if (format & FORMAT_UNDERLINE) content = <u>{content}</u>;
  if (format & FORMAT_ITALIC) content = <em>{content}</em>;
  if (format & FORMAT_BOLD) content = <strong>{content}</strong>;
  return <Fragment key={key}>{content}</Fragment>;
}
