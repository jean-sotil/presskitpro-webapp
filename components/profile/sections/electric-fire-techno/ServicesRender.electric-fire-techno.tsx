'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Electric Fire Techno services — sharp dark cards with cyan glow
 * border, oversized fire-orange index numbers, and gradient-text
 * titles.
 */
type Service = { title: string; description?: string };

export function ServicesElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as Service[] | undefined) ?? [];

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      });

      // 1. Header entrance
      tl.fromTo(
        '[data-fire-services-header] > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );

      // 2. Cards staggered reveal
      tl.fromTo(
        '[data-fire-service-card]',
        { opacity: 0, scale: 0.9, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.4)',
        },
        '-=0.4'
      );

      // 3. Fire glow pulse (consistent with About)
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

  if (services.length === 0) return null;

  return (
    <section
      ref={containerRef}
      id="servicos"
      data-fire-cards
      className="relative isolate border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
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
      <div className="relative z-10 mx-auto max-w-5xl">
        <div data-fire-services-header className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            04 — {t('label')}
          </p>
          <h2
            data-fire-section-title
            className="mt-6 font-display uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
          >
            {t('label')}
          </h2>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {services.map((service, idx) => (
            <li
              key={`${service.title}-${idx}`}
              data-fire-service-card
              className="group relative overflow-hidden border bg-surface p-6 transition-transform duration-base motion-safe:hover:-translate-y-1"
            >
              <p
                aria-hidden="true"
                className="absolute right-4 top-2 select-none font-display leading-none tracking-tight"
                style={{
                  fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                  color: 'rgba(255, 69, 0, 0.18)',
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </p>
              <p
                className="relative font-mono text-[10px] uppercase tracking-[0.25em]"
                style={{ color: '#FF8C00' }}
              >
                {String(idx + 1).padStart(2, '0')} / SERVICE
              </p>
              <h3 className="relative mt-4 font-display text-2xl uppercase tracking-tight md:text-3xl">
                {service.title}
              </h3>
              {service.description ? (
                <p className="relative mt-4 max-w-prose text-sm leading-[1.7] text-text-muted">
                  {service.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
