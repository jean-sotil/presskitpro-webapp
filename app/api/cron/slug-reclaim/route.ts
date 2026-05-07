import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { sendEmail } from '@/lib/email/send';
import { renderSlugReclaimEmail } from '@/lib/email/templates/slug-reclaim';
import { payload } from '@/lib/payload';
import {
  signKeepSlugToken,
} from '@/lib/slug-reclaim/keep-slug-token';
import {
  sweepInactiveSlugs,
  type SweepCandidate,
} from '@/lib/slug-reclaim/sweep';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM_ADDRESS = process.env.HEALTH_EMAIL_FROM ?? 'noreply@presskit.pro';
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

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

  const start = Date.now();
  const p = await payload();

  const result = await sweepInactiveSlugs({
    now: () => new Date(),
    keepUrlBuilder: ({ profileId, warningAt }) => {
      const token = signKeepSlugToken({
        profileId,
        warningAt: warningAt.toISOString(),
      });
      return `${APP_URL}/api/slug/keep?token=${encodeURIComponent(token)}`;
    },

    async findCandidates() {
      // Status filter: skip paused (90-day grace handled elsewhere) but
      // include soft-released so the finalize tick can run.
      const found = await p.find({
        collection: 'profiles',
        where: {
          and: [
            {
              status: {
                in: ['draft', 'published', 'unpublished', 'soft-released'],
              },
            },
          ],
        },
        depth: 1,
        limit: 1000,
        overrideAccess: true,
      });

      const out: SweepCandidate[] = [];
      for (const doc of found.docs) {
        const owner = (doc as { owner?: number | { id?: number; email?: string; stripeSubscriptionStatus?: string | null } }).owner;
        const ownerEmail =
          typeof owner === 'object' && owner !== null
            ? String((owner as { email?: string }).email ?? '')
            : '';
        if (!ownerEmail) continue;
        const subStatus =
          typeof owner === 'object' && owner !== null
            ? ((owner as { stripeSubscriptionStatus?: string | null })
                .stripeSubscriptionStatus ?? null)
            : null;
        out.push({
          profileId: (doc as { id?: number | string }).id!,
          slug: String((doc as { slug?: string }).slug ?? ''),
          status:
            ((doc as { status?: string }).status as SweepCandidate['status']) ??
            'draft',
          profileUpdatedAt: parseDate(
            (doc as { updatedAt?: string }).updatedAt,
          ),
          ownerEmail,
          ownerLocale:
            (doc as { defaultLocale?: string }).defaultLocale ?? 'pt-BR',
          // Last sign-in lives in Supabase auth; we don't query it here
          // for v1 — the cron runs against profile + analytics activity
          // signals only. Adding the auth join is a follow-up once the
          // perf cost is measured.
          lastSignInAt: null,
          lastEventAt: null,
          hasActiveSubscription:
            subStatus === 'active' || subStatus === 'past_due',
          slugReclaimWarningAt: parseDate(
            (doc as { slugReclaimWarningAt?: string })
              .slugReclaimWarningAt,
          ),
          slugSoftReleasedAt: parseDate(
            (doc as { slugSoftReleasedAt?: string }).slugSoftReleasedAt,
          ),
        });
      }
      return out;
    },

    async sendWarning({ candidate, keepUrl }) {
      const rendered = await renderSlugReclaimEmail({
        kind: 'warning',
        slug: candidate.slug,
        keepUrl,
        payloadLocale: candidate.ownerLocale,
      });
      await sendEmail({
        to: candidate.ownerEmail,
        from: FROM_ADDRESS,
        subject: rendered.subject,
        body: rendered.body,
      });
    },

    async sendReleased({ candidate }) {
      const rendered = await renderSlugReclaimEmail({
        kind: 'released',
        slug: candidate.slug,
        payloadLocale: candidate.ownerLocale,
      });
      await sendEmail({
        to: candidate.ownerEmail,
        from: FROM_ADDRESS,
        subject: rendered.subject,
        body: rendered.body,
      });
    },

    async stampWarning({ profileId, at }) {
      await p.update({
        collection: 'profiles',
        id: profileId,
        data: { slugReclaimWarningAt: at.toISOString() },
        overrideAccess: true,
      });
    },

    async softRelease({ profileId, at }) {
      await p.update({
        collection: 'profiles',
        id: profileId,
        data: {
          status: 'soft-released',
          slugSoftReleasedAt: at.toISOString(),
        },
        overrideAccess: true,
      });
    },

    async finalizeRelease({ profileId, currentSlug }) {
      // Rotate the slug to a "tombstone" suffix so the original slug
      // returns to the available pool. The Profile row stays put — the
      // user can claim a new slug via onboarding.
      const rotated = `${currentSlug}-r${Date.now().toString(36)}`;
      await p.update({
        collection: 'profiles',
        id: profileId,
        data: {
          slug: rotated,
          status: 'unpublished',
          slugReclaimWarningAt: null,
          slugSoftReleasedAt: null,
        },
        overrideAccess: true,
      });
    },

    audit(entry) {
      // For v1 we just log structured entries; analytics_events
      // ingestion is a follow-up once a back-office query needs it.
      console.log('[slug-reclaim]', entry);
    },
  });

  return NextResponse.json({
    ok: true,
    ...result,
    durationMs: Date.now() - start,
  });
}

function parseDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input === 'string' && input.length > 0) {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}
