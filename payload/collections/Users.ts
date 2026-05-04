import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    description:
      'Application users. Mirrored from Supabase Auth; never edited directly except via the auth-sync webhook.',
    defaultColumns: ['email', 'displayName', 'role', 'plan', 'supabaseUserId'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
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
