'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

import { TrackedPressKitAnchor } from '../TrackedPressKitAnchor';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Dead Signal press kit link section template
 *
 * Layout: Terminal-centric centered box with a red "Download" button.
 */
export function PressKitLinkDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.pressKit');
  const tProviders = useTranslations('profile.pressKit.providers');
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  const health = (bundle.profile.pressKitHealthStatus ?? 'unknown') as
    | 'unknown'
    | 'healthy'
    | 'warning'
    | 'broken';
  const provider = (bundle.profile.pressKitProvider ?? 'unknown') as PressKitProvider;
  const slug = String(bundle.profile.slug ?? '');
  const badge = providerBadge(tProviders, provider);

  useGSAP(
    () => {
      const scroller = document.querySelector('[data-preview-scroller]') || window;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          scroller: scroller,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power4.out' },
      });

      // 1. Background Reveal
      tl.fromTo(
        '[data-bg-layer]',
        { opacity: 0, scale: 1.05 },
        { opacity: 0.3, scale: 1, duration: 1.5 }
      );

      // 2. Content Reveal
      tl.fromTo(
        '[data-content-group] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.2 },
        '-=1'
      );

      // 3. CTA Reveal
      tl.fromTo(
        '[data-cta-wrapper]',
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1 },
        '-=0.6'
      );

      // 4. Randomized Pulse for the button (Continuous)
      gsap.to('[data-cta-button]', {
        boxShadow: () => `0 0 ${15 + Math.random() * 20}px rgba(239, 68, 68, 0.4)`,
        duration: () => 0.5 + Math.random() * 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    },
    { scope: containerRef, dependencies: [url, health] }
  );

  if (!url) return null;
  if (health === 'broken') return null;

  return (
    <section
      ref={containerRef}
      id="press-kit"
      className="relative border-t border-white/10 bg-black/80 font-mono text-gray-300 backdrop-blur-md"
    >
      <div className="absolute inset-0 z-0" data-bg-layer>
        <Image
          src="/presets/dead-signal/presskit-bg.png"
          alt=""
          width={1200}
          height={600}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div data-content-group>
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
              08 // {t('label')}
            </p>

            <h2
              className="mt-6 font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('heading')}
            </h2>

            <p className="mt-6 max-w-md text-gray-400">{t('description')}</p>
          </div>

          <div className="flex flex-col items-center justify-center" data-cta-wrapper>
            <TrackedPressKitAnchor
              href={url}
              provider={provider}
              profileSlug={slug}
              data-cta-button
              className="group relative inline-flex h-16 items-center justify-center overflow-hidden border-2 border-red-500 bg-transparent px-10 text-lg uppercase tracking-[0.2em] text-red-400 transition-all duration-300 ease-in-out hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
            >
              <span className="relative z-10 flex items-center gap-4">{t('ctaLegacy')}</span>
              <div className="absolute inset-0 h-full w-full bg-red-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {/* Glitch effect */}
              <div className="absolute left-0 top-0 h-full w-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/2 -translate-x-full transform-gpu bg-cyan-400/20 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
                <div className="absolute right-0 top-0 h-full w-1/2 translate-x-full transform-gpu bg-red-500/20 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
              </div>
            </TrackedPressKitAnchor>

            {badge ? (
              <p className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                <span className="h-px w-4 bg-gray-600" />
                {badge}
                <span className="h-px w-4 bg-gray-600" />
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function providerBadge(t: (key: string) => string, provider: PressKitProvider): string | null {
  if (provider === 'unknown' || provider === 'other') return null;
  try {
    return t(provider);
  } catch {
    return null;
  }
}
