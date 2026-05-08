import type { CollectionConfig } from 'payload';

import { supabaseStrategy } from '../../lib/auth/payload-strategy';
import { ownsSelf } from '../../lib/payload/access/predicates';

/**
 * Application users — mirrored from Supabase Auth.
 *
 * Auth: local strategy is disabled; the only entry point is the custom
 * Supabase strategy, which reads the request's session cookie, calls
 * `auth.getUser()`, and looks up the row by `supabaseUserId`. The
 * auth-sync webhook (`/api/webhooks/supabase-auth`) is the only writer
 * that creates these rows. See ADR-0001.
 *
 * `enableFields: true` keeps Payload's auth fields (loginAttempts, etc.)
 * on the table so types stay stable, even though we never use them.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: { enableFields: true },
    strategies: [supabaseStrategy()],
  },
  admin: {
    useAsTitle: 'email',
    description:
      'Application users. Mirrored from Supabase Auth; never edited directly except via the auth-sync webhook.',
    defaultColumns: ['email', 'displayName', 'role', 'plan', 'supabaseUserId'],
  },
  access: {
    // Mirrors are written only by the auth-sync webhook (service role); no
    // admin-UI create/delete path. Reads/updates are scoped to self.
    read: ownsSelf,
    update: ownsSelf,
    create: ({ req }) => Boolean(req.user) && req.user!.collection === 'admins',
    delete: ({ req }) => Boolean(req.user) && req.user!.collection === 'admins',
  },
  fields: [
    {
      name: 'supabaseUserId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'UUID from Supabase auth.users. Authoritative identity key.',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'displayName',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      name: 'plan',
      type: 'select',
      required: true,
      defaultValue: 'trial',
      options: [
        // `trial` was historically labeled `free`; existing rows are
        // backfilled via a one-shot SQL UPDATE documented in the
        // runbook. Both old (`free`) and new (`trial`) values resolve
        // to the same UX (no paid features) so a stray legacy row
        // doesn't break runtime.
        { label: 'Free / Trial', value: 'trial' },
        { label: 'Pro', value: 'pro' },
        { label: 'Agency', value: 'agency' },
      ],
    },
    {
      name: 'trialEndsAt',
      type: 'date',
      admin: {
        description: 'Set on first profile creation; consumed by the trial-expiration cron (task-23).',
      },
    },

    // ----- LGPD account deletion (task-33) -----
    {
      name: 'deletionRequestedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description:
          'When the user clicked "Delete my account" in /dashboard/settings/privacy. Profiles are soft-deleted (status=unpublished, public 404) immediately; the hard-delete cron sweeps 14 days later.',
      },
    },

    // ----- Stripe billing (task-23) -----
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        readOnly: true,
        description:
          'Set on first checkout attempt (lazy customer creation). Webhook handler reads this to match incoming events.',
      },
    },
    {
      name: 'stripeSubscriptionId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Set by `checkout.session.completed`; cleared by `customer.subscription.deleted`.',
      },
    },
    {
      name: 'stripeSubscriptionStatus',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Past due', value: 'past_due' },
        { label: 'Canceled', value: 'canceled' },
      ],
      admin: {
        readOnly: true,
        description: 'Mirrored from Stripe webhooks. Null when no subscription has ever been created.',
      },
    },

    // ----- Onboarding wizard state (task-06) -----
    // Cleared (set to null/empty) on wizard completion. Shape:
    //   { step: 1..5, slug?, taglinePtBR?, services?: string[], customServices?: string[],
    //     socialPlatform?, socialUrl?, portraitId?, logoId?, completedAt? }
    {
      name: 'onboardingProgress',
      type: 'json',
      admin: {
        readOnly: true,
        description:
          'Wizard progress. Owned by the wizard server actions; do not edit directly from admin.',
      },
    },
  ],
  timestamps: true,
};
