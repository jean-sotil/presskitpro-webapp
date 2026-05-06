import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { aggregateRollup } from '@/lib/analytics/aggregate-rollup';
import {
  fetchEventsForDay,
  getOrCreateSaltForDay,
  upsertDailyRollups,
} from '@/lib/analytics/supabase-events';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Daily analytics rollup. Two effects per run:
 *
 *   1. Aggregate yesterday's `analytics_events` into
 *      `analytics_daily_rollups` (idempotent — keyed on
 *      `(profile_id, event_type, day)`).
 *   2. Eagerly create tomorrow's salt row so the visitor-hash flip is
 *      ready before the UTC date boundary. The /api/track route
 *      lazy-creates as a fallback if this miss-fires.
 *
 * Cadence: hourly is fine — yesterday's window is closed, so we just
 * keep upserting the same numbers. The runbook recipe documents the
 * curl path.
 */
export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'cron not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (!provided || !constantTimeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const yesterday = ymdOffset(-1);
  const tomorrow = ymdOffset(1);

  const events = await fetchEventsForDay(supabase, yesterday);
  const rows = aggregateRollup({ events, day: yesterday });
  const upsert = await upsertDailyRollups(supabase, rows);

  // Fire-and-forget the salt warm-up — failure is fine, the route falls
  // back on demand.
  void getOrCreateSaltForDay(supabase, tomorrow);

  return NextResponse.json({
    ok: true,
    day: yesterday,
    rollups: upsert.written,
    eventsScanned: events.length,
  });
}

function ymdOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
