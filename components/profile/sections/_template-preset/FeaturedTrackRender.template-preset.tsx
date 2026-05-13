'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyIframe } from '../LazyIframe';

gsap.registerPlugin(useGSAP);

/**
 * [PRESET-NAME] featured track section template
 *
 * Replace this description with your preset's featured-track design
 * philosophy. The embed itself (SoundCloud / Spotify / YouTube) is
 * owned by the provider iframe; only the surrounding chrome belongs
 * to the preset.
 *
 * Key points to document:
 *   - Frame style around the embed (border, glow, panel, none)
 *   - Section header treatment (numbered marker, mono caption, etc.)
 *   - Width clamp / centering strategy
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Pull `track.url` and `track.oembedHtml` from `bundle.featuredTrack`
 *   - Return null when no URL is set
 *   - Render `<LazyIframe>` when oEmbed HTML is present, else a fallback
 *     anchor so the user can still reach the original URL
 */
export function FeaturedTrack_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.featuredTrack');
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);

  const track = bundle.featuredTrack as { url?: string; oembedHtml?: string | null } | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;

  useGSAP(
    () => {
      const tl = gsap.timeline();
      const p = containerRef.current?.querySelector('p');
      const h2 = containerRef.current?.querySelector('h2');

      if (p) {
        tl.fromTo(
          p,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
      }

      if (h2) {
        tl.fromTo(
          h2,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.3'
        );
      }

      if (embedRef.current) {
        tl.fromTo(
          embedRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out' },
          '-=0.3'
        );
      }
    },
    { scope: containerRef }
  );

  if (!url) return null;

  return (
    <section
      ref={containerRef}
      id="faixa"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          07 — {t('heading')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        <div ref={embedRef} className="mt-12 overflow-hidden border border-border bg-surface p-1">
          {oembedHtml ? (
            <LazyIframe html={oembedHtml} />
          ) : (
            <p className="break-all p-6 text-center text-sm text-text-muted">
              <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                {t('openExternal')} ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
