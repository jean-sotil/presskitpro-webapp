'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';

import type { Profile } from '@/payload-types';

import { ContactForm } from '../ContactForm';

gsap.registerPlugin(useGSAP);

/**
 * Bunker 909 Contact
 * Brutalist form container with industrial warning markers and heavy framing.
 */
export function ContactBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.contact');
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const profile = bundle.profile as unknown as Profile;
  const showForm = profile.contactFormEnabled === true;
  const destinationEmail = (profile.contactFormDestination || profile.contactEmail) as string | undefined;

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // Label pulses in
      if (labelRef.current) {
        tl.fromTo(
          labelRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out' },
          0
        );
      }

      // Title slides in from left
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, x: -60 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
          0.1
        );
      }

      // Badge (909) bounces in
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' },
          0.2
        );
      }

      // Form container fades and slides up
      if (formContainerRef.current) {
        tl.fromTo(
          formContainerRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          0.5
        );
      }

      // Warning garnish fades in
      if (warningRef.current) {
        tl.fromTo(
          warningRef.current,
          { opacity: 0 },
          { opacity: 0.3, duration: 0.5, ease: 'power2.out' },
          0.8
        );
      }

      // Footer annotation fades in
      if (footerRef.current) {
        tl.fromTo(
          footerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' },
          0.9
        );
      }
    },
    { scope: sectionRef }
  );

  if (!showForm || !destinationEmail) return null;

  return (
    <section
      ref={sectionRef}
      id="contato"
      className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative border-4 border-[#1a1a1a] bg-[#050505] p-8 md:p-12">
          {/* Industrial Header for the Form */}
          <div className="mb-12 border-b-4 border-[#ff5c00] pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p ref={labelRef} className="text-[10px] uppercase tracking-[0.4em] text-[#ff5c00] mb-2">
                   TRANSMISSION_CHANNEL // 04
                </p>
                <h2 ref={titleRef} className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
                  {t('label')}<span className="text-[#ff5c00]">.</span>TERMINAL
                </h2>
              </div>
              <div ref={badgeRef} className="hidden h-16 w-16 bg-[#ff5c00] p-1 md:block">
                 <div className="h-full w-full border-2 border-black border-dashed flex items-center justify-center">
                    <span className="text-black font-bold text-xl">909</span>
                 </div>
              </div>
            </div>
          </div>

          <div ref={formContainerRef} className="relative z-10 selection:bg-[#ff5c00] selection:text-black">
            <ContactForm
              profileId={profile.id}
            />
          </div>

          {/* Warning Garnish */}
          <div ref={warningRef} className="mt-12 flex items-center gap-6 opacity-30">
             <div className="h-px flex-1 bg-[#1a1a1a]" />
             <span className="text-[10px] tracking-widest uppercase">Warning: Secure channel active</span>
             <div className="h-px flex-1 bg-[#1a1a1a]" />
          </div>
        </div>

        {/* Technical Footer Annotation */}
        <div ref={footerRef} className="mt-8 text-center text-[10px] tracking-widest text-[#333]">
           BUNKER_CORE // SMTP_RELAY_v1 // ENCRYPTED_HANDSHAKE
        </div>
      </div>
    </section>
  );
}
