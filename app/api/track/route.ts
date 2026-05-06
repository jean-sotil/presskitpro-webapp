import { NextResponse } from 'next/server';

import { hashVisitor } from '@/lib/analytics/hash-visitor';
import {
  deriveLocale,
  deriveProfileSlugFromPath,
  deriveReferrerHost,
} from '@/lib/analytics/derive-event';
import {
  getOrCreateSaltForDay,
  insertAnalyticsEvent,
} from '@/lib/analytics/supabase-events';
import { payload } from '@/lib/payload';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'press_kit_click',
  'contact_click',
  'social_click',
] as const);

const MAX_BODY_BYTES = 2_048;

const BOT_RX = /(bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|whatsapp|preview|headlesschrome|lighthouse)/i;

/**
 * Public, fire-and-forget event capture endpoint. Returns 204 on every
 * non-malformed request — analytics is best-effort by contract.
 *
 * Body shape:
 *   { event: 'page_view' | 'press_kit_click' | 'contact_click' | 'social_click',
 *     profileSlug: string,
 *     referrer?: string,
 *     props?: Record<string, string | number | boolean | null> }
 *
 * The route NEVER sets cookies (PRD §15). Visitor uniqueness is derived
 * from a daily-rotating salt + IP+UA hash; see lib/analytics/hash-visitor.
 */
export async function POST(req: Request) {
  // Cap body size cheaply — drop anything suspicious early.
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = parseTrackBody(body);
  if (!parsed) return new NextResponse(null, { status: 400 });

  // Bot filter: a small UA denylist keeps obvious crawlers out of the
  // count. False negatives are acceptable for v1.
  const userAgent = req.headers.get('user-agent') ?? '';
  if (BOT_RX.test(userAgent)) return new NextResponse(null, { status: 204 });

  const slug = deriveProfileSlugFromPath(`/${parsed.profileSlug}`);
  if (!slug) return new NextResponse(null, { status: 400 });

  const p = await payload();
  const profileResult = await p.find({
    collection: 'profiles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const profile = profileResult.docs[0];
  if (!profile) return new NextResponse(null, { status: 204 });

  const supabase = supabaseAdmin();
  const today = todayUtcYmd();
  const salt = await getOrCreateSaltForDay(supabase, today);

  const ip = clientIpFrom(req);
  const visitorHash = salt ? hashVisitor({ ip, userAgent, salt }) : null;

  const selfHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL ?? '').host || undefined;
    } catch {
      return undefined;
    }
  })();
  const referrerHost = deriveReferrerHost(parsed.referrer ?? null, { selfHost });
  const locale = deriveLocale(req.headers.get('accept-language'));
  const country = req.headers.get('x-vercel-ip-country');

  // Fire-and-forget: do NOT await the insert in a way that blocks the
  // response. Returning 204 immediately is the contract; the insert
  // races us, and `keepalive` on the client kept the connection open
  // until the work completes. Sentry (task-28) will alert on persistent
  // failures.
  void insertAnalyticsEvent(supabase, {
    profileId: Number(profile.id),
    eventType: parsed.event,
    occurredAt: new Date(),
    visitorHash,
    referrerHost,
    locale,
    country: country?.slice(0, 2) ?? null,
  });

  return new NextResponse(null, { status: 204 });
}

type ParsedBody = {
  event: 'page_view' | 'press_kit_click' | 'contact_click' | 'social_click';
  profileSlug: string;
  referrer?: string | null;
};

function parseTrackBody(raw: unknown): ParsedBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const event = typeof r.event === 'string' ? r.event : '';
  const profileSlug = typeof r.profileSlug === 'string' ? r.profileSlug : '';
  const referrer = typeof r.referrer === 'string' ? r.referrer : null;
  if (!ALLOWED_EVENTS.has(event as ParsedBody['event'])) return null;
  if (!profileSlug || profileSlug.length > 100) return null;
  return { event: event as ParsedBody['event'], profileSlug, referrer };
}

function clientIpFrom(req: Request): string {
  // Vercel and most reverse proxies set `x-forwarded-for: client, edge1, …`
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? '0.0.0.0';
}

function todayUtcYmd(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
