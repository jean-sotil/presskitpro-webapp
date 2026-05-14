'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { Profile } from '@/payload-types';

import { ContactForm } from '../ContactForm';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Nuclear Winter Contact
 * Secure terminal for fallout-proof communications.
 */
export function ContactNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.contact');
  const profile = bundle.profile as unknown as Profile;
  const showForm = profile.contactFormEnabled === true;
  const destinationEmail = (profile.contactFormDestination || profile.contactEmail) as string | undefined;

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

      // 1. Container Reveal
      tl.fromTo(
        '[data-main-container]',
        { opacity: 0, scale: 0.98, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2 }
      );

      // 2. Header Content Reveal
      tl.fromTo(
        '[data-header] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.2 },
        '-=0.8'
      );

      // 3. Form Reveal
      tl.fromTo(
        '[data-form-wrapper]',
        { opacity: 0 },
        { opacity: 1, duration: 1 },
        '-=0.4'
      );

      // 4. Footer & Metadata Reveal
      tl.fromTo(
        ['[data-footer]', '[data-metadata]'],
        { opacity: 0 },
        { opacity: 1, duration: 0.8, stagger: 0.2 },
        '-=0.6'
      );

      // 5. Geiger dot flickering
      gsap.to('[data-geiger-dot]', {
        opacity: () => Math.random() * 0.7 + 0.3,
        duration: () => Math.random() * 0.3 + 0.1,
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: containerRef }
  );

  if (!showForm || !destinationEmail) return null;

  return (
    <section
      id="contato"
      ref={containerRef}
      className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40"
    >
      <div className="mx-auto max-w-4xl">
        <div className="fractured-border relative bg-black/60 p-10 md:p-16 lg:p-20" data-main-container>
          {/* Header */}
          <div className="mb-16 border-b border-[#e0eaff]/10 pb-12" data-header>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#e0eaff]/60 mb-3">
                   SECURE_TRANS // CH_04
                </p>
                <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-8xl">
                  {t('label')}<span className="text-[#e0eaff]">.</span>PORTAL
                </h2>
              </div>
              <div className="hidden h-20 w-20 border border-[#e0eaff]/10 p-1 md:block">
                 <div className="h-full w-full bg-[#e0eaff]/5 flex items-center justify-center">
                    <span className="text-[#e0eaff]/40 font-bold text-2xl" data-geiger-dot>!</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 selection:bg-[#e0eaff] selection:text-black" data-form-wrapper>
            <ContactForm
              profileId={profile.id}
            />
          </div>

          {/* Footer warning */}
          <div className="mt-16 flex items-center gap-6 opacity-10" data-footer>
             <div className="h-px flex-1 bg-[#e0eaff]" />
             <span className="text-[9px] tracking-[0.5em] uppercase text-[#e0eaff]">SIGNAL_ENCRYPTED_BY_FALLOUT_NET</span>
             <div className="h-px flex-1 bg-[#e0eaff]" />
          </div>
        </div>
        
        {/* Decorative metadata */}
        <div className="mt-12 text-center text-[10px] tracking-[0.6em] text-[#111] uppercase" data-metadata>
           VAULT_CORE // 0.0.0.0 // RAD_SHIELD_V4
        </div>
      </div>
    </section>
  );
}
