import 'server-only';

import { randomBytes } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { EventType, RawEvent, RollupRow } from './aggregate-rollup';

/**
 * Service-role read/write helpers for the three analytics tables. All
 * functions are best-effort — they return either the data or `null` /
 * `0` on failure. The /api/track route turns failures into 204s.
 */

export type AnalyticsEventInsert = {
  profileId: number;
  eventType: EventType;
  occurredAt: Date;
  visitorHash: string | null;
  referrerHost: string | null;
  locale: string | null;
  country: string | null;
};

export async function insertAnalyticsEvent(
  supabase: SupabaseClient,
  ev: AnalyticsEventInsert,
): Promise<{ ok: boolean }> {
  const { error } = await supabase.from('analytics_events').insert({
    profile_id: ev.profileId,
    event_type: ev.eventType,
    occurred_at: ev.occurredAt.toISOString(),
    visitor_hash: ev.visitorHash,
    referrer_host: ev.referrerHost,
    locale: ev.locale,
    country: ev.country,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] insertAnalyticsEvent', error.message);
    return { ok: false };
  }
  return { ok: true };
}

export async function upsertDailyRollups(
  supabase: SupabaseClient,
  rows: RollupRow[],
): Promise<{ written: number }> {
  if (rows.length === 0) return { written: 0 };
  const payload = rows.map((r) => ({
    profile_id: r.profileId,
    event_type: r.eventType,
    day: r.day,
    count: r.count,
    unique_count: r.uniqueCount,
    top_referrers: r.topReferrers,
    computed_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('analytics_daily_rollups')
    .upsert(payload, { onConflict: 'profile_id,event_type,day' });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] upsertDailyRollups', error.message);
    return { written: 0 };
  }
  return { written: rows.length };
}

export async function fetchEventsForDay(
  supabase: SupabaseClient,
  day: string,
): Promise<RawEvent[]> {
  const start = `${day}T00:00:00Z`;
  const end = `${day}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from('analytics_events')
    .select('profile_id,event_type,occurred_at,visitor_hash,referrer_host')
    .gte('occurred_at', start)
    .lte('occurred_at', end)
    .limit(100_000);
  if (error || !data) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] fetchEventsForDay', error?.message);
    return [];
  }
  return data.map((r) => ({
    profileId: Number(r.profile_id),
    eventType: r.event_type as EventType,
    occurredAt: r.occurred_at,
    visitorHash: r.visitor_hash,
    referrerHost: r.referrer_host,
  }));
}

export async function fetchRollupsForOwner(
  supabase: SupabaseClient,
  args: { profileIds: number[]; sinceDay: string },
): Promise<RollupRow[]> {
  if (args.profileIds.length === 0) return [];
  const { data, error } = await supabase
    .from('analytics_daily_rollups')
    .select('profile_id,event_type,day,count,unique_count,top_referrers')
    .in('profile_id', args.profileIds)
    .gte('day', args.sinceDay);
  if (error || !data) return [];
  return data.map((r) => ({
    profileId: Number(r.profile_id),
    eventType: r.event_type as EventType,
    day: r.day,
    count: r.count ?? 0,
    uniqueCount: r.unique_count ?? 0,
    topReferrers: Array.isArray(r.top_referrers) ? r.top_referrers : [],
  }));
}

/**
 * Reads (and lazily creates) the salt for the given UTC day. Multiple
 * concurrent requests will race on the insert — the unique constraint on
 * `day` makes the loser's insert fail, then the second SELECT returns
 * the winner's row. That's why this is a read-or-create, not a put.
 */
export async function getOrCreateSaltForDay(
  supabase: SupabaseClient,
  day: string,
): Promise<Buffer | null> {
  const found = await supabase
    .from('analytics_salts')
    .select('salt')
    .eq('day', day)
    .maybeSingle();
  if (found.data?.salt) return decodeBytea(found.data.salt);

  const fresh = randomBytes(32);
  const insert = await supabase
    .from('analytics_salts')
    .insert({ day, salt: encodeBytea(fresh) })
    .select('salt')
    .maybeSingle();
  if (insert.data?.salt) return decodeBytea(insert.data.salt);

  // Lost the race — re-read.
  const after = await supabase
    .from('analytics_salts')
    .select('salt')
    .eq('day', day)
    .maybeSingle();
  return after.data?.salt ? decodeBytea(after.data.salt) : null;
}

// Supabase serializes `bytea` as a `\x...` string; encode/decode through hex.
function decodeBytea(value: unknown): Buffer | null {
  if (typeof value !== 'string') return null;
  const hex = value.startsWith('\\x') ? value.slice(2) : value;
  return Buffer.from(hex, 'hex');
}
function encodeBytea(buf: Buffer): string {
  return `\\x${buf.toString('hex')}`;
}
