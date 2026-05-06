'use client';

import { useEffect, useRef, useState } from 'react';

export interface LazyEmbedProps {
  /** Pre-sanitized HTML — either an `<iframe>` (Graph oEmbed path) or a
   *  `<blockquote class="instagram-media">` (fallback path). */
  html: string;
  placeholderHeightPx?: number;
}

/**
 * Generic intersection-deferred mount, similar to LazyIframe (task-16)
 * but with one extra side-effect: when *any* `LazyEmbed` mounts a
 * blockquote with `class="instagram-media"`, we ensure
 * `https://www.instagram.com/embed.js` is loaded once and call
 * `window.instgrm.Embeds.process()` so the blockquote hydrates into a
 * real iframe. The Graph oEmbed iframe path doesn't need any of that.
 */
export function LazyEmbed({ html, placeholderHeightPx = 540 }: LazyEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldMount]);

  // After mount, hydrate any blockquotes via embed.js.
  useEffect(() => {
    if (!shouldMount) return;
    if (!html.includes('instagram-media')) return;
    ensureInstagramEmbedScript().then((instgrm) => {
      try {
        instgrm?.Embeds?.process();
      } catch {
        // Hydration failures are non-fatal — the fallback link inside the
        // blockquote keeps the post reachable.
      }
    });
  }, [shouldMount, html]);

  return (
    <div
      ref={ref}
      style={{ minHeight: placeholderHeightPx }}
      className="bg-bg"
      data-testid="lazy-embed-mount"
    >
      {shouldMount ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}
    </div>
  );
}

// ----- embed.js loader (singleton) -------------------------------------

declare global {
  interface Window {
    instgrm?: { Embeds: { process(): void } };
  }
}

const SCRIPT_SRC = 'https://www.instagram.com/embed.js';
let scriptPromise: Promise<Window['instgrm'] | undefined> | null = null;

function ensureInstagramEmbedScript(): Promise<Window['instgrm'] | undefined> {
  if (typeof window === 'undefined') return Promise.resolve(undefined);
  if (window.instgrm) return Promise.resolve(window.instgrm);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', () => resolve(window.instgrm));
    s.addEventListener('error', () => {
      scriptPromise = null;
      resolve(undefined);
    });
    document.head.appendChild(s);
  });
  return scriptPromise;
}
