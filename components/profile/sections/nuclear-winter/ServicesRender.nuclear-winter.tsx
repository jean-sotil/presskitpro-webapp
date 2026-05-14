'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Nuclear Winter Services
 * Desolate cards with cold signal borders and survivalist-metadata.
 */
export function ServicesNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const services =
    (bundle.content?.services as Array<{ title: string; description?: string }> | undefined) ?? [];

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
        '[data-header]',
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1 }
      );

      // 2. Cards Staggered Reveal
      tl.fromTo(
        '[data-service-card]',
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.15 },
        '-=0.6'
      );

      // 3. Metadata Reveal
      tl.fromTo(
        '[data-metadata]',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.8 },
        '-=0.4'
      );

      // 4. Geiger dots flickering
      gsap.to('[data-geiger-dot]', {
        opacity: () => Math.random() * 0.7 + 0.3,
        duration: () => Math.random() * 0.3 + 0.1,
        repeat: -1,
        yoyo: true,
      });

      // 5. Hover effects for cards
      const cards = containerRef.current?.querySelectorAll('[data-service-card]');
      cards?.forEach((card) => {
        const border = card.querySelector('.fractured-border');
        const title = card.querySelector('[data-card-title]');

        card.addEventListener('mouseenter', () => {
          gsap.to(border, { 
            backgroundColor: 'rgba(224, 234, 255, 0.05)', 
            boxShadow: '0 0 25px rgba(224, 234, 255, 0.05)',
            duration: 0.3 
          });
          gsap.to(title, { color: '#e0eaff', duration: 0.3 });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(border, { 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            boxShadow: '0 0 0px rgba(224, 234, 255, 0)',
            duration: 0.3 
          });
          gsap.to(title, { color: '#ffffff', duration: 0.3 });
        });
      });
    },
    { scope: containerRef }
  );

  if (services.length === 0) return null;

  return (
    <section id="servicos" ref={containerRef} className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 flex items-center gap-8" data-header>
          <h2 className="font-display text-6xl uppercase tracking-tighter text-white md:text-8xl">
            SVR<span className="text-[#e0eaff]">.</span>MOD
          </h2>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-[#e0eaff]/20 to-transparent" />
        </div>

        <ul className="grid gap-8 md:grid-cols-2">
          {services.map((s, i) => (
            <li key={`${s.title}-${i}`} className="group" data-service-card>
              <div className="fractured-border relative bg-black/40 p-10 transition-all">
                <div className="absolute top-6 right-6 text-[10px] font-bold text-[#1a1a1a] transition-colors group-hover:text-[#e0eaff]/40 uppercase tracking-widest">
                  MODULE_{i.toString().padStart(2, '0')}
                </div>
                
                <p className="font-display text-3xl uppercase tracking-[0.1em] text-white transition-colors" data-card-title>
                  {s.title}
                </p>
                
                {s.description ? (
                  <div className="mt-8 border-t border-[#e0eaff]/5 pt-8">
                    <p className="text-sm leading-relaxed tracking-wider text-[#555] uppercase">
                      {s.description}
                    </p>
                  </div>
                ) : null}

                {/* Status indicator */}
                <div className="absolute bottom-6 right-6 flex items-center gap-3">
                   <span className="text-[9px] font-bold text-[#111] uppercase group-hover:text-[#333]">ACTIVE_LINK</span>
                   <div className="h-1.5 w-1.5 bg-[#111] transition-colors group-hover:bg-[#e0eaff]" data-geiger-dot />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Section metadata */}
        <div className="mt-20 flex justify-start" data-metadata>
           <div className="border-l border-[#e0eaff]/20 pl-8">
              <span className="text-[10px] tracking-[0.4em] text-[#222] uppercase leading-relaxed">
                RESOURCE_ALLOCATION: MINIMAL<br />
                PRIORITY_LEVEL: SURVIVAL
              </span>
           </div>
        </div>
      </div>
    </section>
  );
}
