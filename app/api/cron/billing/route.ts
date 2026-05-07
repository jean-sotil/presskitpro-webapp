import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { pauseExpiredTrials } from '@/lib/billing/pause-expired-trials';
import { payload } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'cron not configured' },
      { status: 500 },
    );
  }

  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (!provided || !constantTimeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const p = await payload();
  const now = new Date();

  const result = await pauseExpiredTrials({
    now,
    deps: {
      findExpiredCandidates: async (cutoff) => {
        const cutoffIso = cutoff.toISOString();
        const found = await p.find({
          collection: 'users',
          where: {
            and: [
              { trialEndsAt: { less_than: cutoffIso } },
              {
                or: [
                  { stripeSubscriptionStatus: { equals: 'canceled' } },
                  { stripeSubscriptionStatus: { exists: false } },
                  { stripeSubscriptionStatus: { equals: null } },
                ],
              },
            ],
          },
          limit: 200,
          depth: 0,
          overrideAccess: true,
        });
        return found.docs.map((doc) => ({
          id: doc.id,
          email: doc.email ?? null,
          trialEndsAt:
            typeof doc.trialEndsAt === 'string'
              ? doc.trialEndsAt
              : (doc.trialEndsAt as Date | null)?.toISOString() ?? new Date(0).toISOString(),
        }));
      },
      findReminderCandidates: async (n) => {
        const windowEnd = new Date(n.getTime() + TWO_DAYS_MS).toISOString();
        const windowStart = n.toISOString();
        const found = await p.find({
          collection: 'users',
          where: {
            and: [
              { trialEndsAt: { greater_than: windowStart } },
              { trialEndsAt: { less_than: windowEnd } },
              { plan: { in: ['trial', 'free'] } },
              {
                or: [
                  { stripeSubscriptionStatus: { exists: false } },
                  { stripeSubscriptionStatus: { equals: null } },
                ],
              },
            ],
          },
          limit: 200,
          depth: 0,
          overrideAccess: true,
        });
        return found.docs.map((doc) => ({
          id: doc.id,
          email: doc.email ?? null,
          trialEndsAt:
            typeof doc.trialEndsAt === 'string'
              ? doc.trialEndsAt
              : (doc.trialEndsAt as Date | null)?.toISOString() ?? new Date(0).toISOString(),
        }));
      },
      pauseUserProfiles: async (userId) => {
        const result = await p.update({
          collection: 'profiles',
          where: { owner: { equals: userId } },
          data: { status: 'paused' },
          overrideAccess: true,
        });
        return result.docs.length;
      },
      sendReminderEmail: async ({ email, daysRemaining }) => {
        if (!process.env.RESEND_API_KEY) {
          // Same posture as task-14: log the would-be email until
          // RESEND_API_KEY lands.
          // eslint-disable-next-line no-console
          console.log('[cron-billing] reminder-email-stub', {
            to: email,
            daysRemaining,
          });
          return;
        }
        // Live send wires in task-31 — the import is intentionally
        // omitted here to keep task-23's blast radius small.
        // eslint-disable-next-line no-console
        console.log('[cron-billing] reminder-email-stub (live api key set)', {
          to: email,
          daysRemaining,
        });
      },
      markReminderSent: async (_userId) => {
        // No-op for now: the reminder window is 2 days wide and the cron
        // runs hourly, so the same user will receive 24-48 reminders
        // before expiry. Until task-31 adds a `trialReminderSentAt`
        // column, treat this as a hot-path TODO. Reminders are
        // logged-only in dev anyway.
      },
      log: (entry) => {
        // eslint-disable-next-line no-console
        console.log('[cron-billing]', entry);
      },
    },
  });

  return NextResponse.json({ ok: true, ...result });
}
