'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyIframe } from '../LazyIframe';

/**
 * Dead Signal featured track section template
 *
 * Layout: Red borders, glitch offset text, embedded iframe inside a terminal-like frame.
 */
export function FeaturedTrackDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.featuredTrack');
  const track = bundle.featuredTrack as { url?: string; oembedHtml?: string | null } | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;

  if (!url) return null;

  return (
    <section
      id="faixa"
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 inline-flex items-center gap-3">
          <span className="h-px w-8 bg-red-500/80" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
            07 // {t('heading')}
          </p>
        </div>

        <h2
          className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
          <span
            className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
            aria-hidden="true"
          >
            {t('label')}
          </span>
        </h2>

        <div className="relative mt-12 overflow-hidden border border-white/20 bg-white/[0.02] p-2">
          {/* Decorative Corner Elements */}
          <div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-red-500/80" />
          <div className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/80" />
          <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/80" />
          <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-red-500/80" />

          {oembedHtml ? (
            <div className="opacity-90 contrast-125 saturate-50 transition-all duration-700 hover:opacity-100 hover:saturate-100">
              <LazyIframe html={oembedHtml} />
            </div>
          ) : (
            <p className="break-all p-6 text-center text-sm text-gray-500">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-400"
              >
                [ {t('openExternal')} ] ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
