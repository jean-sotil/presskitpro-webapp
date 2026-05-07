import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { sendEmail } from '@/lib/email/send';
import { renderPressKitEmail } from '@/lib/email/templates/press-kit';
import { checkPressKitUrl } from '@/lib/health-check/check-press-kit-url';
import {
  sweepPressKitHealth,
  type SweepProfile,
} from '@/lib/health-check/sweep';
import { payload } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM_ADDRESS =
  process.env.HEALTH_EMAIL_FROM ?? 'noreply@presskit.pro';

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

  const result = await sweepPressKitHealth({
    now: () => new Date(),
    async findCandidates() {
      const found = await p.find({
        collection: 'profiles',
        where: {
          and: [
            { status: { equals: 'published' } },
            { pressKitUrl: { exists: true } },
            { pressKitUrl: { not_equals: '' } },
          ],
        },
        limit: 1000,
        depth: 1,
        overrideAccess: true,
      });
      return found.docs
        .map((doc): SweepProfile | null => {
          const id = (doc as { id?: number | string }).id;
          const slug = (doc as { slug?: string }).slug ?? '';
          const url = (doc as { pressKitUrl?: string }).pressKitUrl ?? '';
          if (id === undefined || !url) return null;
          const owner = (doc as { owner?: number | { id?: number; email?: string } })
            .owner;
          const ownerEmail =
            typeof owner === 'object' && owner !== null
              ? String((owner as { email?: string }).email ?? '')
              : '';
          if (!ownerEmail) return null;
          return {
            id,
            slug,
            pressKitUrl: url,
            pressKitHealthStatus:
              ((doc as { pressKitHealthStatus?: string }).pressKitHealthStatus as
                | 'unknown'
                | 'healthy'
                | 'warning'
                | 'broken') ?? 'unknown',
            pressKitConsecutiveFails:
              Number(
                (doc as { pressKitConsecutiveFails?: number })
                  .pressKitConsecutiveFails ?? 0,
              ) || 0,
            defaultLocale:
              (doc as { defaultLocale?: string }).defaultLocale ?? 'pt-BR',
            ownerEmail,
          };
        })
        .filter((x): x is SweepProfile => x !== null);
    },
    async checkUrl(url) {
      return checkPressKitUrl(url, { fetch });
    },
    async updateProfile({ profileId, patch }) {
      await p.update({
        collection: 'profiles',
        id: profileId,
        data: patch,
        overrideAccess: true,
      });
    },
    async sendWarningEmail({ profile, to }) {
      const rendered = await renderPressKitEmail({
        kind: 'warning',
        url: profile.pressKitUrl,
        payloadLocale: profile.defaultLocale,
      });
      await sendEmail({
        to,
        from: FROM_ADDRESS,
        subject: rendered.subject,
        body: rendered.body,
      });
    },
    async sendBrokenEmail({ profile, to }) {
      const rendered = await renderPressKitEmail({
        kind: 'broken',
        url: profile.pressKitUrl,
        payloadLocale: profile.defaultLocale,
      });
      await sendEmail({
        to,
        from: FROM_ADDRESS,
        subject: rendered.subject,
        body: rendered.body,
      });
    },
  });

  return NextResponse.json({
    ok: true,
    ...result,
    durationMs: Date.now() - start,
  });
}
