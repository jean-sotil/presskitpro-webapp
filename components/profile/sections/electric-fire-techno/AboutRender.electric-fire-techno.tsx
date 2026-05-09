'use client';

import { useTranslations } from 'next-intl';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * Electric Fire Techno biography — centered prose framed by radial
 * fire-glow gradients on every edge plus a subtle inner ring. Per
 * docs/presets/MediakitPRO_template_3.json `biography.frameStyle`.
 *
 * Visual rhythm: numbered "01 — Biography" mono marker, oversized
 * gradient-text heading, single-column centered prose at ~720px max
 * width (the spec's `maxTextWidth`). The fire frame is decorative
 * (aria-hidden) — content remains readable for screen readers.
 *
 * The fire glow uses `data-fire-frame` so the CSS in globals.css can
 * apply box-shadow + edge-gradient pseudo-elements without polluting
 * the variant component with long inline-style strings.
 */
export function AboutElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);
  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      className="relative isolate overflow-hidden border-b border-border bg-bg px-6 py-24 md:px-12 md:py-32"
    >
      {/* Decorative fire frame — radial gradients on each edge. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,_rgba(255,69,0,0.35)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,140,0,0.28)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(ellipse_at_left,_rgba(255,69,0,0.22)_0%,_transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(ellipse_at_right,_rgba(255,140,0,0.2)_0%,_transparent_70%)]"
      />
      <div className="relative z-10 mx-auto max-w-[720px] text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          {t('label')}
        </p>
        <h2
          data-fire-section-title
          className="mt-6 font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
        >
          {t('heading')}
        </h2>
        {tagline ? (
          <p className="mx-auto mt-8 max-w-prose text-base leading-relaxed text-text md:text-lg">
            {tagline}
          </p>
        ) : null}
        {hasBio ? (
          <RichTextRender
            state={bio}
            className="mx-auto mt-6 max-w-prose text-sm leading-[1.7] text-text-muted md:text-base"
          />
        ) : null}
      </div>
    </section>
  );
}
