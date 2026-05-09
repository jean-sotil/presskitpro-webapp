'use client';

import { useTranslations } from 'next-intl';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * [PRESET-NAME] biography section template
 *
 * Replace this description with your preset's bio design philosophy.
 * Key points to document:
 *   - Layout (single column, split, etc.)
 *   - Styling approach for tagline and rich text
 *   - Spacing and typography scale
 *   - Decorative elements
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Extract `tagline` and `bio` from bundle
 *   - Use `isEmptyLexicalState()` to check if bio is empty
 *   - Return null if no content exists
 *   - Use `<RichTextRender>` to render the bio Lexical state
 */
export function Bio_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          01 — {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('heading')}
        </h2>
        {tagline ? (
          <p className="mt-6 max-w-prose text-base leading-relaxed text-text">
            {tagline}
          </p>
        ) : null}
        {hasBio ? (
          <RichTextRender
            state={bio}
            className="mt-6 max-w-prose text-base leading-relaxed text-text-muted"
          />
        ) : null}
      </div>
    </section>
  );
}
