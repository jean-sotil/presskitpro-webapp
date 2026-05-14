'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactForm } from '../ContactForm';
import { TrackedContactCta } from '../TrackedContactCta';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

/**
 * Dead Signal contact section template
 *
 * Layout: Harsh borders, dark panel with glitch/cyber hover states for CTAs.
 */
export function ContactDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.contact');
  const profile = bundle.profile as ProfileWithContact;
  const whatsapp = profile.contactWhatsapp?.trim() ?? '';
  const email = profile.contactEmail?.trim() ?? '';
  const formEnabled = Boolean(profile.contactFormEnabled);
  const profileId = Number(profile.id);
  const profileSlug = profile.slug;

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
        '[data-header-group] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.2 }
      );

      // 2. CTAs Reveal
      tl.fromTo(
        '[data-contact-cta]',
        { opacity: 0, scale: 0.9, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1 },
        '-=0.4'
      );

      // 3. Form Reveal
      tl.fromTo(
        '[data-form-container]',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.4'
      );

      // 4. Continuous flickering for specific markers
      const blinkers = containerRef.current?.querySelectorAll('[data-blink]');
      blinkers?.forEach((blinker) => {
        gsap.to(blinker, {
          opacity: () => Math.random() * 0.7 + 0.3,
          duration: () => Math.random() * 0.4 + 0.1,
          repeat: -1,
          yoyo: true,
        });
      });
    },
    { scope: containerRef }
  );

  if (!whatsapp && !email && !formEnabled) return null;

  return (
    <section
      ref={containerRef}
      id="contato"
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-start gap-3" data-header-group>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-red-500/80" data-blink />
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
              05 // {t('label')}
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
        </div>

        {whatsapp || email ? (
          <ul className="mt-12 flex flex-wrap gap-4">
            {whatsapp ? (
              <li data-contact-cta>
                <TrackedContactCta
                  href={whatsappHref(whatsapp)}
                  channel="whatsapp"
                  profileSlug={profileSlug}
                  className="group relative inline-flex h-12 items-center overflow-hidden border border-red-500/50 bg-red-500/10 px-8 text-xs uppercase tracking-widest text-red-400 transition-all hover:border-red-500 hover:bg-red-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <span className="relative z-10">{t('whatsappCta')}</span>
                  <div className="absolute left-0 top-0 h-1 w-1 border-l border-t border-red-500" />
                  <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-red-500" />
                </TrackedContactCta>
              </li>
            ) : null}
            {email ? (
              <li data-contact-cta>
                <TrackedContactCta
                  href={emailHref(email)}
                  channel="email"
                  profileSlug={profileSlug}
                  className="group relative inline-flex h-12 items-center overflow-hidden border border-white/20 bg-black/50 px-8 text-xs uppercase tracking-widest text-gray-300 transition-all hover:border-white/50 hover:bg-white/5 hover:text-white"
                >
                  <span className="relative z-10">{t('emailCta')}</span>
                  <div className="absolute left-0 top-0 h-1 w-1 border-l border-t border-white/50" />
                  <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-white/50" />
                </TrackedContactCta>
              </li>
            ) : null}
          </ul>
        ) : null}

        {formEnabled && profileId > 0 ? (
          <div className="relative mt-12 max-w-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8" data-form-container>
            <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white/30" />
            <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-white/30" />
            <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/30" />
            <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/30" />
            <ContactForm profileId={profileId} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function whatsappHref(value: string): string {
  if (value.startsWith('http')) return value;
  const digits = value.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

function emailHref(value: string): string {
  return value.startsWith('mailto:') ? value : `mailto:${value}`;
}
