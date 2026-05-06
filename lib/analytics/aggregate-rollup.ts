/**
 * Pure (side-effect-free) aggregation of raw events into the per-day
 * rollup rows the dashboard reads. Inputs are the events for a single
 * UTC day; output is what the cron upserts into `analytics_daily_rollups`.
 *
 * Putting the math here lets us TDD without the database — the cron
 * route is then a thin "fetch → aggregate → upsert" composition.
 */

export type EventType = 'page_view' | 'press_kit_click' | 'contact_click' | 'social_click';

export type RawEvent = {
  profileId: number;
  eventType: EventType;
  occurredAt: string; // ISO-8601 UTC
  visitorHash: string | null;
  referrerHost: string | null;
};

export type RollupRow = {
  profileId: number;
  eventType: EventType;
  day: string; // YYYY-MM-DD
  count: number;
  uniqueCount: number;
  topReferrers: Array<{ host: string; count: number }>;
};

const TOP_N_REFERRERS = 5;

export function aggregateRollup(args: {
  events: RawEvent[];
  day: string; // YYYY-MM-DD
}): RollupRow[] {
  const { day } = args;
  const dayStart = Date.parse(`${day}T00:00:00Z`);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  // (profileId, eventType) → bucket
  const buckets = new Map<string, {
    profileId: number;
    eventType: EventType;
    count: number;
    uniqueHashes: Set<string>;
    referrerCounts: Map<string, number>;
  }>();

  for (const ev of args.events) {
    const t = Date.parse(ev.occurredAt);
    if (Number.isNaN(t) || t < dayStart || t >= dayEnd) continue;

    const key = `${ev.profileId}:${ev.eventType}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        profileId: ev.profileId,
        eventType: ev.eventType,
        count: 0,
        uniqueHashes: new Set<string>(),
        referrerCounts: new Map<string, number>(),
      };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (ev.visitorHash) bucket.uniqueHashes.add(ev.visitorHash);
    if (ev.referrerHost) {
      bucket.referrerCounts.set(
        ev.referrerHost,
        (bucket.referrerCounts.get(ev.referrerHost) ?? 0) + 1,
      );
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    profileId: b.profileId,
    eventType: b.eventType,
    day,
    count: b.count,
    uniqueCount: b.uniqueHashes.size,
    topReferrers: Array.from(b.referrerCounts.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, z) => z.count - a.count || a.host.localeCompare(z.host))
      .slice(0, TOP_N_REFERRERS),
  }));
}
