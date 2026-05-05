import { describe, expect, it, vi } from 'vitest';

import { createRateLimiter } from './rate-limit';
import {
  handleContactSubmit,
  type ContactSubmitDeps,
} from './contact-submit-handler';

function makeDeps(overrides: Partial<ContactSubmitDeps> = {}): {
  deps: ContactSubmitDeps;
  sent: Array<{ to: string; from: string; subject: string; body: string }>;
} {
  const sent: Array<{ to: string; from: string; subject: string; body: string }> = [];
  const deps: ContactSubmitDeps = {
    rateLimiter: createRateLimiter({ windowMs: 60_000, max: 5 }),
    fromAddress: 'contact@test.example',
    findProfile: vi.fn(async (id: number) =>
      id === 1
        ? {
            contactEmail: 'artist@example.com',
            contactFormEnabled: true,
            contactFormDestination: 'bookings@example.com',
            slug: 'artist',
          }
        : null,
    ),
    verifyCaptcha: vi.fn(async () => ({ ok: true })),
    sendEmail: vi.fn(async (args) => {
      sent.push(args);
      return { ok: true };
    }),
    ...overrides,
  };
  return { deps, sent };
}

const validBody = {
  name: 'Fan',
  email: 'fan@example.com',
  message: 'Hello, want to book a private set!',
  honeypot: '',
  captchaToken: 'tok',
};

describe('handleContactSubmit', () => {
  it('relays a valid submission to the destination email', async () => {
    const { deps, sent } = makeDeps();
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe('bookings@example.com');
    expect(sent[0]!.body).toContain(validBody.message);
  });

  it('falls back from contactFormDestination to contactEmail when blank', async () => {
    const { deps, sent } = makeDeps({
      findProfile: vi.fn(async () => ({
        contactEmail: 'artist@example.com',
        contactFormEnabled: true,
        contactFormDestination: '',
        slug: 'artist',
      })),
    });
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(200);
    expect(sent[0]!.to).toBe('artist@example.com');
  });

  it('returns 400 when no destination resolvable', async () => {
    const { deps, sent } = makeDeps({
      findProfile: vi.fn(async () => ({
        contactEmail: '',
        contactFormEnabled: true,
        contactFormDestination: '',
        slug: 'artist',
      })),
    });
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('returns 404 when profile is missing', async () => {
    const { deps } = makeDeps();
    const r = await handleContactSubmit({
      deps,
      profileId: 999,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(404);
  });

  it('returns 404 when contactFormEnabled is false', async () => {
    const { deps } = makeDeps({
      findProfile: vi.fn(async () => ({
        contactEmail: 'a@x.com',
        contactFormEnabled: false,
        contactFormDestination: 'a@x.com',
        slug: 'a',
      })),
    });
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(404);
  });

  it('silently 200s when honeypot is filled (no email sent)', async () => {
    const { deps, sent } = makeDeps();
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: { ...validBody, honeypot: 'i-am-a-bot' },
    });
    expect(r.status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  it('returns 429 with Retry-After when rate limit is exceeded', async () => {
    const { deps } = makeDeps({
      rateLimiter: createRateLimiter({
        windowMs: 60_000,
        max: 1,
        now: () => 0,
      }),
    });
    await handleContactSubmit({ deps, profileId: 1, ip: 'X', body: validBody });
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: 'X',
      body: validBody,
    });
    expect(r.status).toBe(429);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it('returns 400 when validation fails', async () => {
    const { deps, sent } = makeDeps();
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: { ...validBody, email: 'not-an-email' },
    });
    expect(r.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('returns 400 when captcha verification fails', async () => {
    const { deps, sent } = makeDeps({
      verifyCaptcha: vi.fn(async () => ({ ok: false })),
    });
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('returns 502 when email send fails', async () => {
    const { deps } = makeDeps({
      sendEmail: vi.fn(async () => ({ ok: false })),
    });
    const r = await handleContactSubmit({
      deps,
      profileId: 1,
      ip: '1.1.1.1',
      body: validBody,
    });
    expect(r.status).toBe(502);
  });
});
