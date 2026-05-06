/**
 * Thin analytics shim. Task-24 wires the public-profile sink (POSTs to
 * `/api/track` via `navigator.sendBeacon`); task-28 will wire PostHog
 * for product events (`onboarding_*`, `profile_*`). The dev fallback
 * console.debug stays — it's the surface that lets us see call sites
 * without ceremony.
 *
 * Contract: `track()` MUST NOT throw. A failing analytics sink is a
 * monitoring problem — not a user-facing one.
 */

export type AnalyticsEvent =
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'wizard_cancelled'
  | 'profile_published'
  | 'profile_unpublished'
  | 'page_view'
  | 'press_kit_click'
  | 'contact_click'
  | 'social_click';

export type AnalyticsSink = (
  event: AnalyticsEvent,
  props?: Record<string, unknown>,
) => void;

let sink: AnalyticsSink | null = null;

export function setSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  try {
    if (sink) {
      sink(event, props);
    } else {
      console.debug(`[track] ${event}`, props);
    }
  } catch {
    // Never break user-facing paths because of analytics.
  }
}
