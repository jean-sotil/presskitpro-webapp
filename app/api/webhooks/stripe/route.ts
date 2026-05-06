import { NextResponse } from 'next/server';

import { handleStripeWebhook } from '@/lib/billing/handle-stripe-webhook';
import { stripeClient } from '@/lib/billing/stripe-client';
import { payload } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    // Refuse to process webhooks without verification — silently 5xx so
    // Stripe retries, surfacing a misconfig in their dashboard.
    return NextResponse.json(
      { error: 'webhook not configured' },
      { status: 500 },
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  // Need the raw body for signature verification — do NOT call req.json()
  // first. `text()` returns the bytes Stripe signed.
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'invalid signature',
        detail: err instanceof Error ? err.message : 'unknown',
      },
      { status: 400 },
    );
  }

  const p = await payload();

  const result = await handleStripeWebhook({
    event: {
      id: event.id,
      type: event.type,
      data: { object: event.data.object as unknown as Record<string, unknown> },
    },
    deps: {
      isEventProcessed: async (eventId) => {
        const found = await p.find({
          collection: 'stripe-webhook-events',
          where: { eventId: { equals: eventId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        return found.totalDocs > 0;
      },
      markEventProcessed: async (eventId, eventType) => {
        try {
          await p.create({
            collection: 'stripe-webhook-events',
            data: {
              eventId,
              eventType,
              processedAt: new Date().toISOString(),
            },
            overrideAccess: true,
          });
        } catch {
          // Race with a concurrent retry: the unique constraint on
          // `eventId` swallowed it. Treat as success — the other request
          // will (or already did) finish the work.
        }
      },
      findUserByCustomerId: async (customerId) => {
        const found = await p.find({
          collection: 'users',
          where: { stripeCustomerId: { equals: customerId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        const doc = found.docs[0];
        return doc ? { id: doc.id, email: doc.email } : null;
      },
      findUserByEmail: async (email) => {
        const found = await p.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        const doc = found.docs[0];
        return doc ? { id: doc.id, email: doc.email } : null;
      },
      updateUser: async (userId, patch) => {
        await p.update({
          collection: 'users',
          id: userId,
          data: patch,
          overrideAccess: true,
        });
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
      log: (entry) => {
        // eslint-disable-next-line no-console
        console.log('[stripe-webhook]', entry);
      },
    },
  });

  return NextResponse.json({ ok: true, ...result });
}
