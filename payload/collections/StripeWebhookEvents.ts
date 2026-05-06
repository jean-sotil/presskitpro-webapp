import type { CollectionConfig } from 'payload';

/**
 * Idempotency log for Stripe webhook events (task-23).
 *
 * Stripe retries webhooks until it gets a 2xx; the same `event.id`
 * frequently arrives 2-3 times. The route writes the id here on first
 * arrival; subsequent arrivals see the row and short-circuit.
 *
 * Read/write only by service role (the webhook route uses Payload Local
 * API with `overrideAccess: true`). No admin-UI exposure beyond
 * read-only inspection.
 */
export const StripeWebhookEvents: CollectionConfig = {
  slug: 'stripe-webhook-events',
  admin: {
    useAsTitle: 'eventId',
    description:
      'Stripe webhook idempotency log. Read-only — written by /api/webhooks/stripe.',
    defaultColumns: ['eventId', 'eventType', 'processedAt'],
  },
  access: {
    // Only admins can read in the admin UI; service-role webhook writes
    // bypass access via `overrideAccess: true`.
    read: ({ req }) =>
      Boolean(req.user) && req.user!.collection === 'admins',
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Stripe's `event.id`. Unique constraint enforces idempotency.",
      },
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
      admin: { description: "Stripe's `event.type` (e.g. checkout.session.completed)." },
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
    },
  ],
  timestamps: true,
};
