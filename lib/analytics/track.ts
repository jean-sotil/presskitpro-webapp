/**
 * Thin analytics shim. Task-24 wires PostHog via `setSink(posthogSink)`
 * once at app startup. Until then, events log to `console.debug` so dev
 * runs surface the call sites without ceremony.
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
  | 'press_kit_click';

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
