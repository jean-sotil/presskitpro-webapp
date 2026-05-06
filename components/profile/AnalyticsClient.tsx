'use client';

import { useEffect } from 'react';

import { makeBrowserSink } from '@/lib/analytics/browser-sink';
import { setSink } from '@/lib/analytics/track';

/**
 * Tiny client snippet that registers the browser analytics sink for the
 * lifetime of a public-profile page. Mounts once near the root of
 * `app/[slug]/page.tsx`. Click components (`TrackedPressKitAnchor`,
 * `TrackedContactCta`, `TrackedSocialLink`) call `track()`, which the
 * sink turns into `navigator.sendBeacon('/api/track', …)`.
 *
 * `page_view` is fired by middleware on the server side — this snippet
 * intentionally does NOT re-fire it (avoids double-counting).
 */
export function AnalyticsClient({ profileSlug }: { profileSlug: string }) {
  useEffect(() => {
    setSink(makeBrowserSink(profileSlug));
    return () => setSink(null);
  }, [profileSlug]);
  return null;
}
