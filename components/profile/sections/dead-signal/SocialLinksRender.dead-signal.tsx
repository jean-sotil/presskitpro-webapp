'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { PlatformIcon } from '../PlatformIcon';
import { TrackedSocialLink } from '../TrackedSocialLink';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Dead Signal social links section template
 *
 * Layout: Pill list with harsh borders and red/cyan cyber highlights on hover.
 */
export function SocialLinksDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.social');
  const tPlatforms = useTranslations('profile.social.platforms');
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;

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

      // 2. Links Reveal
      tl.fromTo(
        '[data-social-link]',
        { opacity: 0, x: -20, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 0.6, stagger: 0.08 },
        '-=0.4'
      );

      // 3. Hover effects (Managed by GSAP)
      const linkItems = containerRef.current?.querySelectorAll('[data-social-link] > a');
      linkItems?.forEach((link) => {
        link.addEventListener('mouseenter', () => {
          gsap.to(link, { x: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ffffff', duration: 0.2 });
        });
        link.addEventListener('mouseleave', () => {
          gsap.to(link, { x: 0, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(156, 163, 175, 1)', duration: 0.2 });
        });
      });
    },
    { scope: containerRef, dependencies: [raw.length] }
  );

  if (!raw.length) return null;

  return (
    <section 
      ref={containerRef}
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-start gap-3" data-header-group>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-red-500/80" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
              04 // {t('label')}
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

        <ul className="mt-12 flex flex-wrap gap-4">
          {links.map((link) => {
            const href = hrefFor(link);
            let label: string;
            try {
              label = tPlatforms(link.platform);
            } catch {
              label = link.platform;
            }
            const external = link.platform !== 'email' && link.platform !== 'whatsapp';
            return (
              <li key={String(link.id)} data-social-link>
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="group relative inline-flex h-12 items-center gap-3 overflow-hidden border border-white/20 bg-white/[0.02] px-6 text-xs uppercase tracking-widest text-gray-400 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-white"
                >
                  <PlatformIcon platform={link.platform} />
                  <span className="relative z-10">{label}</span>
                  {/* Cyber brackets */}
                  <div className="absolute left-0 top-0 h-1 w-1 border-l border-t border-transparent transition-colors group-hover:border-red-500" />
                  <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-transparent transition-colors group-hover:border-red-500" />
                </TrackedSocialLink>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Coerce legacy email/whatsapp rows that may store a bare address. */
function hrefFor(link: LinkRow): string {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`;
  }
  if (link.platform === 'whatsapp') {
    if (link.url.startsWith('http')) return link.url;
    const digits = link.url.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  }
  return link.url;
}
