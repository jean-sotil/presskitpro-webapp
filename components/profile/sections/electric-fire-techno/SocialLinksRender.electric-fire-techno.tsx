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
 * Electric Fire Techno social section — centered 2-column grid of
 * outlined buttons.
 */
export function SocialLinksElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.social');
  const tPlatforms = useTranslations('profile.social.platforms');
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;

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
        '[data-fire-social-header] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );

      // 2. Links staggered reveal
      tl.fromTo(
        '[data-fire-social-link]',
        { opacity: 0, scale: 0.9, y: 15 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        },
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
    { scope: containerRef, dependencies: [raw.length] }
  );

  if (!raw.length) return null;

  return (
    <section
      ref={containerRef}
      data-glow-buttons
      className="relative border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
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
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div data-fire-social-header>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            03 — {t('label')}
          </p>
          <h2
            data-fire-section-title
            className="mt-6 font-display uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('label')}
          </h2>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <li key={String(link.id)} data-fire-social-link>
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="group flex h-12 w-full items-center justify-center gap-3 border bg-transparent px-5 text-xs font-bold uppercase tracking-[0.18em] text-text transition-colors duration-quick hover:bg-accent/5"
                >
                  <span className="text-text transition-colors duration-quick">
                    <PlatformIcon platform={link.platform} />
                  </span>
                  <span>{label}</span>
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