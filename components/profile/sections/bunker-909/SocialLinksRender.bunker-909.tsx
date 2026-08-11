'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';

import { TrackedSocialLink } from '../TrackedSocialLink';

gsap.registerPlugin(useGSAP);

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Bunker 909 Social Links
 * Large industrial buttons with heavy borders and technical numbering.
 */
export function SocialLinksBunker909({ bundle }: { bundle: EditorBundle }) {
  const tPlatforms = useTranslations('profile.social.platforms');
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];

  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;

  useGSAP(
    () => {
      const tl = gsap.timeline();
      const linkItems = gridRef.current?.querySelectorAll('li');
      if (!linkItems) return;

      // Title slides in
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, x: -60 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
          0
        );
      }

      // Status indicator pulses in
      if (statusRef.current) {
        tl.fromTo(
          statusRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out' },
          0.2
        );
      }

      // Link buttons staggered reveal
      tl.fromTo(
        linkItems,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
        0.4
      );

      // Hover effects for link buttons
      const handlers = new Map();
      linkItems.forEach((item) => {
        const link = item.querySelector('a');
        if (!link) return;

        const onHover = () => {
          gsap.to(link, { borderColor: '#ff5c00', duration: 0.3, ease: 'power2.out' });
          gsap.to(link, { backgroundColor: '#ff5c00', duration: 0.3, ease: 'power2.out' });
          gsap.to(link, { color: '#000', duration: 0.3, ease: 'power2.out' });
          gsap.to(link, { scale: 1.02, duration: 0.3, ease: 'power2.out' });
        };

        const onHoverOut = () => {
          gsap.to(link, { borderColor: '#1a1a1a', duration: 0.3, ease: 'power2.out' });
          gsap.to(link, { backgroundColor: '#050505', duration: 0.3, ease: 'power2.out' });
          gsap.to(link, { color: '#fff', duration: 0.3, ease: 'power2.out' });
          gsap.to(link, { scale: 1, duration: 0.3, ease: 'power2.out' });
        };

        link.addEventListener('mouseenter', onHover);
        link.addEventListener('mouseleave', onHoverOut);
        handlers.set(link, { onHover, onHoverOut });
      });

      return () => {
        handlers.forEach(({ onHover, onHoverOut }, link) => {
          link.removeEventListener('mouseenter', onHover);
          link.removeEventListener('mouseleave', onHoverOut);
        });
      };
    },
    { scope: sectionRef, dependencies: [raw.length] }
  );

  if (!raw.length) return null;

  return (
    <section ref={sectionRef} className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between border-b border-[#1a1a1a] pb-8">
           <h2 ref={titleRef} className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
             LINK<span className="text-[#ff5c00]">.</span>NODES
           </h2>
           <div ref={statusRef} className="text-right text-[10px] tracking-widest text-[#333]">
              HUB_STATUS: ONLINE<br />
              CONNECTED_PIPES: {links.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <li key={String(link.id)} className="group">
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex flex-col items-start border-4 border-[#1a1a1a] bg-[#050505] p-6 transition-all group-hover:border-[#ff5c00] group-hover:bg-[#ff5c00] group-hover:text-black"
                >
                  <span className="mb-8 text-[10px] font-bold text-[#333] transition-colors group-hover:text-black/50">
                    PORT_{i.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xl font-bold uppercase tracking-widest text-white transition-colors group-hover:text-black">
                    {label}
                  </span>
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
