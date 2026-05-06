'use client';

import type { ReactNode } from 'react';

import { track } from '@/lib/analytics/track';

/**
 * Tracked contact CTA — wraps the WhatsApp / email anchors. Fires
 * `contact_click` with the channel before the browser navigates.
 */
export function TrackedContactCta({
  href,
  channel,
  profileSlug,
  className,
  children,
}: {
  href: string;
  channel: 'whatsapp' | 'email';
  profileSlug: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track('contact_click', { channel, profileSlug })}
    >
      {children}
    </a>
  );
}
