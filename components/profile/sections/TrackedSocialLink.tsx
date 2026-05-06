'use client';

import type { ReactNode } from 'react';

import { track } from '@/lib/analytics/track';

/**
 * Tracked social-link anchor. Fires `social_click` with the platform
 * before the browser navigates. Re-rels in `SocialLinksRender` are
 * preserved by passing `rel`/`target` through.
 */
export function TrackedSocialLink({
  href,
  platform,
  profileSlug,
  className,
  rel,
  target,
  children,
}: {
  href: string;
  platform: string;
  profileSlug: string;
  className?: string;
  rel?: string;
  target?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      rel={rel}
      target={target}
      onClick={() => track('social_click', { platform, profileSlug })}
    >
      {children}
    </a>
  );
}
