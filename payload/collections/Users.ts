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
      defaultValue: 'free',
      options: [
        { label: 'Free / Trial', value: 'free' },
        { label: 'Pro', value: 'pro' },
      ],
    },
    {
      name: 'trialEndsAt',
      type: 'date',
      admin: {
        description: 'Set on first profile creation; consumed by the trial-expiration cron (task-23).',
      },
    },
  ],
  timestamps: true,
};
