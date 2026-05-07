/**
 * Pure (DI-style) handler for the public contact-form endpoint.
 *
 * Layers (in order):
 *   1. Rate limit per IP                    → 429 + Retry-After
 *   2. Resolve profile + form-enabled gate  → 404
 *   3. Honeypot                             → silent 200
 *   4. Field validation                     → 400
 *   5. Captcha verification                 → 400
 *   6. Resolve destination email
 *      (formDestination → contactEmail → 400)
 *   7. Send email                           → 502 on transport failure
 *   8. 200 ok
 *
 * The route handler at `app/api/profiles/[id]/contact-submit/route.ts`
 * wires the live deps; tests inject mocks. See `task-14`'s plan for the
 * Turnstile + Resend swap-in points.
 */

import { validateContactForm } from './contact-validate';
import type { AsyncRateLimiter } from './rate-limit-kv';

export type ContactProfileSnapshot = {
  contactEmail: string;
  contactFormEnabled: boolean;
  contactFormDestination: string;
  slug: string;
};

export type ContactSubmitDeps = {
  rateLimiter: AsyncRateLimiter;
  /** From address on outbound contact emails. Resend rejects unverified
   *  domains, so dev typically uses `onboarding@resend.dev` and prod
   *  uses an address on a domain verified in the Resend dashboard. */
  fromAddress: string;
  findProfile(id: number): Promise<ContactProfileSnapshot | null>;
  verifyCaptcha(token: string): Promise<{ ok: boolean }>;
  sendEmail(args: {
    to: string;
    from: string;
    subject: string;
    body: string;
  }): Promise<{ ok: boolean }>;
};

export type ContactSubmitBody = {
  name: string;
  email: string;
  message: string;
  honeypot: string;
  captchaToken: string;
};

export type ContactSubmitResult = {
  status: number;
  body: Record<string, unknown>;
  retryAfterSec?: number;
};

export async function handleContactSubmit(args: {
  deps: ContactSubmitDeps;
  profileId: number;
  ip: string;
  body: ContactSubmitBody;
}): Promise<ContactSubmitResult> {
  const { deps, profileId, ip, body } = args;

  const rl = await deps.rateLimiter.check(`contact:${ip}`);
  if (!rl.ok) {
    return {
      status: 429,
      body: { error: 'rate-limited' },
      retryAfterSec: rl.retryAfterSec,
    };
  }

  const profile = await deps.findProfile(profileId);
  if (!profile || !profile.contactFormEnabled) {
    return { status: 404, body: { error: 'not found' } };
  }

  // Honeypot — silent 200 regardless of the rest of the body.
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return { status: 200, body: { ok: true } };
  }

  const validation = validateContactForm({
    name: body.name,
    email: body.email,
    message: body.message,
    honeypot: '', // already cleared
  });
  if (!validation.ok) {
    return { status: 400, body: { error: 'validation', reason: validation.reason } };
  }

  const captcha = await deps.verifyCaptcha(body.captchaToken ?? '');
  if (!captcha.ok) {
    return { status: 400, body: { error: 'captcha' } };
  }

  const destination =
    profile.contactFormDestination?.trim() || profile.contactEmail?.trim() || '';
  if (!destination) {
    return { status: 400, body: { error: 'no-destination' } };
  }

  const sent = await deps.sendEmail({
    to: destination,
    from: deps.fromAddress,
    subject: `[presskit.pro] Nova mensagem para ${profile.slug}`,
    body: renderEmailBody(body),
  });
  if (!sent.ok) {
    return { status: 502, body: { error: 'send-failed' } };
  }
  return { status: 200, body: { ok: true } };
}

function renderEmailBody(body: ContactSubmitBody): string {
  return [
    `De: ${body.name} <${body.email}>`,
    '',
    body.message,
  ].join('\n');
}
