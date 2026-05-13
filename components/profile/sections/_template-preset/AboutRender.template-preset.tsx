'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

gsap.registerPlugin(useGSAP);

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
export function About_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);

  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.fromTo(
        labelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power3.out' }
      )
        .fromTo(
          headingRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(
          taglineRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo(
          bioRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        );
    },
    { scope: containerRef }
  );

  if (!tagline && !hasBio) return null;

  return (
    <section
      ref={containerRef}
      id="sobre"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <p ref={labelRef} className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          01 — {t('label')}
        </p>
        <h2
          ref={headingRef}
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('heading')}
        </h2>
        {tagline ? (
          <p ref={taglineRef} className="mt-6 max-w-prose text-base leading-relaxed text-text">
            {tagline}
          </p>
        ) : null}
        {hasBio ? (
          <div ref={bioRef}>
            <RichTextRender
              state={bio}
              className="mt-6 max-w-prose text-base leading-relaxed text-text-muted"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
