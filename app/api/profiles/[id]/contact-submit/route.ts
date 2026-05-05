import { NextResponse } from 'next/server';

import { payload as getPayloadInstance } from '@/lib/payload';
import {
  handleContactSubmit,
  type ContactProfileSnapshot,
  type ContactSubmitBody,
  type ContactSubmitDeps,
} from '@/lib/server/contact-submit-handler';
import { createRateLimiter } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Module-singleton so the limiter survives request-to-request inside one
// process. PRD §14: 5 / IP / hour. Multi-instance deployments will need
// shared storage — task-27 follow-up.
const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profileId = Number.parseInt(id, 10);
  if (!Number.isInteger(profileId) || profileId <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  let body: ContactSubmitBody;
  try {
    body = (await req.json()) as ContactSubmitBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const ip = clientIp(req);
  const result = await handleContactSubmit({
    deps: liveDeps(),
    profileId,
    ip,
    body,
  });
  const headers: Record<string, string> = {};
  if (result.retryAfterSec !== undefined) {
    headers['Retry-After'] = String(result.retryAfterSec);
  }
  return NextResponse.json(result.body, { status: result.status, headers });
}

function liveDeps(): ContactSubmitDeps {
  return {
    rateLimiter,
    // Resend rejects unverified senders. Default to their free dev sender
    // (`onboarding@resend.dev`) which works for any account without DNS
    // setup; override with CONTACT_FROM_EMAIL once `presskit.pro` is
    // verified in the Resend dashboard.
    fromAddress: process.env.CONTACT_FROM_EMAIL ?? 'onboarding@resend.dev',
    async findProfile(id) {
      try {
        const p = await getPayloadInstance();
        const doc = await p.findByID({
          collection: 'profiles',
          id,
          depth: 0,
          // Public — no `req: { user }`. Payload's read access predicate
          // for profiles requires a session, so we use overrideAccess
          // because this is a public read of a public profile.
          overrideAccess: true,
        });
        if (!doc) return null;
        return {
          contactEmail: String((doc as { contactEmail?: string }).contactEmail ?? ''),
          contactFormEnabled: Boolean(
            (doc as { contactFormEnabled?: boolean }).contactFormEnabled,
          ),
          contactFormDestination: String(
            (doc as { contactFormDestination?: string }).contactFormDestination ?? '',
          ),
          slug: String((doc as { slug: string }).slug ?? ''),
        } satisfies ContactProfileSnapshot;
      } catch {
        return null;
      }
    },
    verifyCaptcha,
    sendEmail,
  };
}

/** Cloudflare Turnstile verification. Until `TURNSTILE_SECRET_KEY` is
 *  set, this is a no-op so the route is testable end-to-end without the
 *  Cloudflare account. The siteverify call is a one-line `fetch`. */
async function verifyCaptcha(token: string): Promise<{ ok: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn('[turnstile] TURNSTILE_SECRET_KEY unset — skipping verification');
    }
    return { ok: true };
  }
  if (!token) return { ok: false };
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const body = (await res.json()) as { success?: boolean };
    return { ok: Boolean(body.success) };
  } catch {
    return { ok: false };
  }
}

/** Resend transactional email. Until `RESEND_API_KEY` is set, this logs
 *  and returns ok — keeps the route testable in dev/CI. */
async function sendEmail(args: {
  to: string;
  from: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // eslint-disable-next-line no-console
    console.warn(
      '[contact-form] RESEND_API_KEY unset — message NOT delivered:',
      args,
    );
    return { ok: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: args.from,
        to: args.to,
        subject: args.subject,
        text: args.body,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.error(
        `[contact-form] Resend rejected (${res.status}):`,
        detail,
        '\n  from:',
        args.from,
        '\n  to:',
        args.to,
      );
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contact-form] Resend fetch failed:', err);
    return { ok: false };
  }
}

function clientIp(req: Request): string {
  // Vercel sets x-forwarded-for; first entry is the originating IP.
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
