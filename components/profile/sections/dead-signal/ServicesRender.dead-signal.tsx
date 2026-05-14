'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Service = { title: string; description?: string };

/**
 * Dead Signal services section template
 *
 * Layout: Harsh grid with terminal-like tiles. Red accents on hover.
 */
export function ServicesDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as Service[] | undefined) ?? [];

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

      // 1. Header Reveal
      tl.fromTo(
        '[data-section-header] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.2 }
      );

      // 2. Cards Staggered Reveal
      tl.fromTo(
        '[data-service-card]',
        { 
          opacity: 0, 
          y: 40, 
          rotation: () => Math.random() * 6 - 3,
          scale: 0.95 
        },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.1,
          rotation: (i) => {
             // Keep the random visual but stabilize a bit
             const el = containerRef.current?.querySelectorAll('[data-service-card]')[i];
             return el ? parseFloat(window.getComputedStyle(el).getPropertyValue('rotation')) || (Math.random() * 4 - 2) : 0;
          }
        },
        '-=0.4'
      );

      // 3. Hover effects (Managed by GSAP for better control)
      const cards = containerRef.current?.querySelectorAll('[data-service-card]');
      cards?.forEach((card) => {
        const title = card.querySelector('[data-card-title]');
        const description = card.querySelector('[data-card-description]');
        const corners = card.querySelectorAll('[data-corner]');

        card.addEventListener('mouseenter', () => {
          gsap.to(card, { rotation: 0, scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)', duration: 0.3 });
          gsap.to(title, { color: '#ef4444', x: 5, duration: 0.3 });
          if (description) {
            gsap.to(description, { opacity: 1, height: 'auto', marginTop: 16, duration: 0.4, ease: 'power2.out' });
          }
          gsap.to(corners, { borderColor: 'rgba(239, 68, 68, 0.8)', scale: 1.2, duration: 0.3 });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotation: Math.random() * 4 - 2, scale: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', duration: 0.3 });
          gsap.to(title, { color: '#ffffff', x: 0, duration: 0.3 });
          if (description) {
            gsap.to(description, { opacity: 0, height: 0, marginTop: 0, duration: 0.3 });
          }
          gsap.to(corners, { borderColor: 'rgba(255, 255, 255, 0.2)', scale: 1, duration: 0.3 });
        });
      });
    },
    { scope: containerRef }
  );

  if (services.length === 0) return null;

  return (
    <section
      id="servicos"
      ref={containerRef}
      className="relative overflow-hidden border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,transparent_70%)]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start gap-3" data-section-header>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-red-500/80" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
              03 // {t('label')}
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
        </div>

        <ul className="mt-20 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, idx) => (
            <li
              key={`${service.title}-${idx}`}
              className="group relative border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 ease-in-out"
              data-service-card
            >
              {/* Corner tech details */}
              <div 
                className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white/20 transition-colors" 
                data-corner
              />
              <div 
                className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/20 transition-colors" 
                data-corner
              />

              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50" />

              <div className="relative">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/80 transition-colors group-hover:text-red-400">
                  <span className="h-1 w-1 bg-red-500/80 group-hover:bg-red-400" />
                  S_{String(idx + 1).padStart(2, '0')}
                </p>

                <h3 
                  className="mt-6 font-display text-xl uppercase tracking-tight text-white transition-colors"
                  data-card-title
                >
                  {service.title}
                </h3>

                {service.description ? (
                  <p 
                    className="mt-0 h-0 overflow-hidden font-sans text-sm leading-relaxed text-gray-500 opacity-0 transition-colors duration-500 ease-in-out"
                    data-card-description
                  >
                    {service.description}
                  </p>
                ) : null}
              </div>

              {/* Glitch effect on hover */}
              <div className="absolute left-0 top-0 h-full w-full overflow-hidden pointer-events-none">
                <div className="absolute left-0 top-0 h-full w-full -translate-x-full transform-gpu bg-red-500/10 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
                <div className="absolute left-0 top-0 h-full w-full translate-x-full transform-gpu bg-cyan-400/10 transition-transform delay-100 duration-300 ease-in-out group-hover:translate-x-0" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
