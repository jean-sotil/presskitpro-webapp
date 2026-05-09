'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyIframe } from './LazyIframe';

/**
 * Electric Fire Techno featured track — full-bleed centered embed
 * inside a cyan-glow framed dark panel, flanked by an animated
 * waveform/equalizer SVG and a numbered "07 — ON ROTATION" mono
 * marker. The embed itself (SoundCloud / Spotify / YouTube) is owned
 * by the provider's iframe; the surrounding chrome is what makes the
 * section distinctive in this preset.
 *
 * The waveform bars use a CSS keyframe per bar with staggered delays
 * so they pulse out of sync — gives the "live audio" feel without
 * Web Audio or canvas. Respects prefers-reduced-motion via globals.css
 * (the bars freeze at their mid-height frame).
 */
export function FeaturedTrackGlowTrack({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.featuredTrack');
  const track = bundle.featuredTrack as
    | { url?: string; oembedHtml?: string | null }
    | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;
  if (!url) return null;

  return (
    <section
      id="faixa"
      data-glow-track
      className="relative isolate overflow-hidden border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-4">
          <Equalizer side="left" />
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            07 — {t('heading')}
          </p>
          <Equalizer side="right" />
        </div>
        <h2
          data-fire-section-title
          className="mt-6 text-center font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        <div
          data-glow-track-frame
          className="relative mt-12 overflow-hidden border bg-surface p-1"
        >
          {oembedHtml ? (
            <LazyIframe html={oembedHtml} />
          ) : (
            <p className="break-all p-6 text-center text-sm text-text-muted">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {t('openExternal')} ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Equalizer({ side }: { side: 'left' | 'right' }) {
  // Mirror right-side equalizer so the bars "play in" toward the label.
  const bars = [0, 1, 2, 3, 4];
  return (
    <span
      aria-hidden="true"
      className="flex h-4 items-end gap-[3px]"
      style={{
        transform: side === 'right' ? 'scaleX(-1)' : undefined,
      }}
    >
      {bars.map((i) => (
        <span
          key={i}
          className="block w-[3px] origin-bottom"
          style={{
            backgroundColor: '#00BFFF',
            boxShadow: '0 0 4px rgba(0, 191, 255, 0.7)',
            height: '100%',
            animation: `equalizer-bar 1s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}
