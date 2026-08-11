'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyIframe } from '../LazyIframe';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Electric Fire Techno featured track — full-bleed centered embed
 * inside a cyan-glow framed dark panel, flanked by an animated
 * waveform/equalizer SVG and a numbered "07 — ON ROTATION" mono
 * marker.
 */
export function FeaturedTrackElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.featuredTrack');
  const track = bundle.featuredTrack as { url?: string; oembedHtml?: string | null } | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      });

      // 1. Header reveal
      tl.fromTo(
        '[data-fire-track-header] > *',
        { opacity: 0, scale: 0.9, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );

      // 2. Track frame entrance
      tl.fromTo(
        '[data-glow-track-frame]',
        { opacity: 0, scale: 0.98, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.4'
      );

      // 3. Fire glow pulse
      gsap.to('[data-fire-glow]', {
        opacity: 0.6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.4,
          from: 'random',
        },
        ease: 'sine.inOut',
      });
    },
    { scope: containerRef }
  );

  if (!url) return null;

  return (
    <section
      ref={containerRef}
      id="faixa"
      data-glow-track
      className="relative isolate overflow-hidden border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,_rgba(255,69,0,0.35)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,140,0,0.28)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(ellipse_at_left,_rgba(255,69,0,0.22)_0%,_transparent_70%)]"
      />
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(ellipse_at_right,_rgba(255,140,0,0.2)_0%,_transparent_70%)]"
      />
      <div className="relative z-10 mx-auto max-w-3xl">
        <div data-fire-track-header>
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
        </div>
        <div data-glow-track-frame className="relative mt-12 overflow-hidden border bg-surface p-1">
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

