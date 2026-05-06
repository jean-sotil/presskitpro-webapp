'use client';

import type { AnalyticsEvent, AnalyticsSink } from './track';

/**
 * `track()` sink that posts to /api/track via `navigator.sendBeacon`.
 *
 * Three guarantees the public profile cares about:
 *   1. Non-blocking — sendBeacon hands the request to the user-agent
 *      and returns immediately. No promise to await.
 *   2. Survives navigation — beacons are guaranteed-delivery during
 *      `unload`. Click events that immediately navigate (press-kit
 *      anchor with `target="_blank"`, contact CTAs) still land.
 *   3. Same-origin — the endpoint is relative; no CORS hops.
 *
 * Events the route doesn't accept (product events like
 * `onboarding_step_completed`) are silently dropped. Task-28 wires a
 * separate PostHog sink for those.
 */

const PUBLIC_EVENTS: ReadonlySet<AnalyticsEvent> = new Set<AnalyticsEvent>([
  'page_view',
  'press_kit_click',
  'contact_click',
  'social_click',
]);

export function makeBrowserSink(profileSlug: string): AnalyticsSink {
  return (event, props) => {
    if (!PUBLIC_EVENTS.has(event)) return;
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      return;
    }
    const body = JSON.stringify({
      event,
      profileSlug,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      props: props ?? null,
    });
    try {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
    } catch {
      // Never throw — analytics is best-effort.
    }
  };
}
