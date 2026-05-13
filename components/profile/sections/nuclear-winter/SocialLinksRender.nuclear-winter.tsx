'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { TrackedSocialLink } from '../TrackedSocialLink';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Nuclear Winter Social Links
 * Terminal-style links with cold signal hover glow and desolate annotations.
 */
export function SocialLinksNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tPlatforms = useTranslations('profile.social.platforms');

  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;

  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        defaults: { ease: 'power4.out' },
      });

      // 1. Header Reveal
      tl.fromTo(
        '[data-header] > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2 }
      );

      // 2. Links Staggered Reveal
      tl.fromTo(
        '[data-social-link]',
        { opacity: 0, x: -20, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8, stagger: 0.1 },
        '-=0.6'
      );

      // 3. Hover effects for links
      const linkItems = containerRef.current?.querySelectorAll('[data-social-link]');
      linkItems?.forEach((item) => {
        const border = item.querySelector('.fractured-border');
        const text = item.querySelector('[data-link-text]');
        const hud = item.querySelector('[data-link-hud]');

        item.addEventListener('mouseenter', () => {
          gsap.to(border, { 
            backgroundColor: 'rgba(224, 234, 255, 0.05)', 
            boxShadow: '0 0 25px rgba(224, 234, 255, 0.05)',
            duration: 0.3 
          });
          gsap.to(text, { color: '#e0eaff', duration: 0.3 });
          gsap.to(hud, { color: 'rgba(224, 234, 255, 0.4)', duration: 0.3 });
        });

        item.addEventListener('mouseleave', () => {
          gsap.to(border, { 
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            boxShadow: '0 0 0px rgba(224, 234, 255, 0)',
            duration: 0.3 
          });
          gsap.to(text, { color: '#ffffff', duration: 0.3 });
          gsap.to(hud, { color: '#1a1a1a', duration: 0.3 });
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative border-b border-[#e0eaff]/5 bg-black px-8 py-24 font-mono md:px-16 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex items-center justify-between border-b border-[#e0eaff]/5 pb-12" data-header>
           <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-8xl">
             LINK<span className="text-[#e0eaff]">.</span>RECEP
           </h2>
           <div className="text-right text-[10px] tracking-[0.5em] text-[#222] uppercase">
              SIG_LOCK: ESTABLISHED<br />
              NODES: {links.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link, i) => {
            const href = hrefFor(link);
            let label: string;
            try {
              label = tPlatforms(link.platform);
            } catch {
              label = link.platform;
            }
            const external = link.platform !== 'email' && link.platform !== 'whatsapp';

            return (
              <li key={String(link.id)} className="group" data-social-link>
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="fractured-border flex flex-col items-start bg-black/40 p-10 transition-all"
                >
                  <div className="mb-10 flex w-full items-center justify-between text-[10px] font-bold text-[#1a1a1a] transition-colors" data-link-hud>
                    <span>NODE_{i.toString().padStart(2, '0')}</span>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100 tracking-widest">ACCESSING...</span>
                  </div>
                  <span className="text-2xl font-bold uppercase tracking-[0.3em] text-white transition-colors" data-link-text>
                    {label}
                  </span>
                  <div className="mt-6 h-0.5 w-0 bg-[#e0eaff]/40 transition-all duration-1000 group-hover:w-full" />
                </TrackedSocialLink>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

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
