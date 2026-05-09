'use client';

import { useTranslations } from 'next-intl';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * Dead Signal biography section template
 *
 * Layout: Single column, dark cyberpunk aesthetic.
 * Styling: Glitchy header typography, stark mono tagline, readable body text
 * with high contrast.
 * Decorative elements: Red/cyan text shadows, corner brackets.
 */
export function AboutDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 inline-flex items-center gap-3">
          <span className="h-px w-8 bg-red-500/80" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
            01 // {t('label')}
          </p>
        </div>

        <h2
          className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('heading')}
          <span
            className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
            aria-hidden="true"
          >
            {t('heading')}
          </span>
        </h2>

        {tagline ? (
          <p className="mt-8 border-l-2 border-red-500 pl-6 text-sm uppercase tracking-widest text-gray-200">
            {tagline}
          </p>
        ) : null}

        {hasBio ? (
          <div className="group relative mt-10 p-6 sm:p-8">
            {/* Corner brackets */}
            <div className="absolute left-0 top-0 h-4 w-4 border-l border-t border-white/20 transition-colors group-hover:border-red-500/50" />
            <div className="absolute right-0 top-0 h-4 w-4 border-r border-t border-white/20 transition-colors group-hover:border-red-500/50" />
            <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/20 transition-colors group-hover:border-red-500/50" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/20 transition-colors group-hover:border-red-500/50" />

            <RichTextRender
              state={bio}
              className="prose prose-invert max-w-none font-sans text-base leading-relaxed text-gray-400"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
