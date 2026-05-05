'use client';

import type { ReactNode } from 'react';

import { track } from '@/lib/analytics/track';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

export interface TrackedPressKitAnchorProps {
  href: string;
  provider: PressKitProvider;
  profileSlug: string;
  className?: string;
  children: ReactNode;
}

/**
 * Public press-kit CTA. Fires `press_kit_click` on click, then lets the
 * browser do its normal `target="_blank"` thing.
 *
 * Kept as a tiny client component so the surrounding `<PressKitLinkRender>`
 * can stay server-rendered (better SEO + no JS for non-interactive readers).
 */
export function TrackedPressKitAnchor({
  href,
  provider,
  profileSlug,
  className,
  children,
}: TrackedPressKitAnchorProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        track('press_kit_click', { provider, profileSlug });
      }}
      className={className}
    >
      {children}
    </a>
  );
}
