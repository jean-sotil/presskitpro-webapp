'use client';

import { useEffect, useRef, useState } from 'react';

export interface LazyIframeProps {
  /** Pre-sanitized HTML containing exactly one `<iframe>`. */
  html: string;
  /** Min-height for the placeholder so the layout doesn't jump on mount. */
  placeholderHeightPx?: number;
}

/**
 * Defers mounting an iframe until its placeholder enters the viewport.
 * Combined with `loading="lazy"` on the iframe itself, this means the
 * SoundCloud player only consumes resources when the user actually
 * scrolls to it. Per PRD §13.
 *
 * The `html` prop is trusted — `extractSafeIframe` produced it
 * server-side. We control the entire string.
 */
export function LazyIframe({ html, placeholderHeightPx = 166 }: LazyIframeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: just mount immediately. No degradation beyond losing
      // the perf optimization.
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
      // Mount slightly before the iframe is visible so the SoundCloud
      // bootstrap has a head start.
      { rootMargin: '200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldMount]);

  return (
    <div
      ref={ref}
      style={{ minHeight: placeholderHeightPx }}
      className="bg-bg"
      data-testid="lazy-iframe-mount"
    >
      {shouldMount ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}
    </div>
  );
}
