import { NextResponse } from 'next/server';

import { getPayPalClientOrThrow } from '@/lib/billing/paypal-client';
import { handlePayPalWebhook } from '@/lib/billing/handle-paypal-webhook';
import { verifyPayPalWebhook } from '@/lib/billing/verify-paypal-webhook';
import { payload } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const transmissionId = req.headers.get('paypal-transmission-id');
  const transmissionTime = req.headers.get('paypal-transmission-time');
  const certUrl = req.headers.get('paypal-cert-url');
  const authAlgo = req.headers.get('paypal-auth-algo');
  const transmissionSig = req.headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: 'missing signature headers' }, { status: 400 });
  }

  const rawBody = await req.text();

  const paypal = getPayPalClientOrThrow();

  const isValid = await verifyPayPalWebhook({
    headers: {
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
    },
    rawBody,
    webhookId,
    paypal,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody) as {
      id: string;
      event_type: string;
      resource: Record<string, unknown>;
      [key: string]: unknown;
    };
  } catch (err) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const p = await payload();

  const result = await handlePayPalWebhook({
    event: {
      id: event.id,
      event_type: event.event_type,
      resource: event.resource as Record<string, unknown>,
    },
    deps: {
      isEventProcessed: async (eventId) => {
        const found = await p.find({
          collection: 'paypal-webhook-events',
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
            collection: 'paypal-webhook-events',
            data: {
              eventId,
              eventType,
              processedAt: new Date().toISOString(),
            },
            overrideAccess: true,
          });
        } catch {
          // Race with concurrent retry — unique constraint swallowed it.
          // Treat as success.
        }
      },
      findUserBySubscriptionId: async (subscriptionId) => {
        const found = await p.find({
          collection: 'users',
          where: { paypalSubscriptionId: { equals: subscriptionId } },
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
        console.log('[paypal-webhook]', entry);
      },
    },
  });

  return NextResponse.json({ ok: true, ...result });
}
