import type { CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsViaProfile,
} from '../../lib/payload/access/predicates';
import {
  decryptTokenAfterRead,
  encryptTokenBeforeChange,
} from '../../lib/payload/hooks/encrypt-token';

/**
 * One IG connection per Profile (1:1).
 *
 * `accessToken` is encrypted at rest via `lib/payload/hooks/encrypt-token.ts`
 * using AES-256-GCM with the `INSTAGRAM_TOKEN_ENCRYPTION_KEY` env var. The
 * raw token is never persisted; only the encrypted blob is stored in
 * Postgres. Decrypt happens in `afterRead` for legitimate consumers.
 */
export const InstagramConnections: CollectionConfig = {
  slug: 'instagram-connections',
  admin: {
    useAsTitle: 'igUserId',
    defaultColumns: ['profile', 'igUserId', 'tokenExpiresAt', 'lastSyncedAt'],
    description:
      'IG access tokens are encrypted at rest. Never paste tokens into the admin UI directly — use the editor flow (task-17).',
  },
  access: {
    read: ownsViaProfile,
    update: ownsViaProfile,
    delete: ownsViaProfile,
    create: canCreateForOwnedProfile,
  },
  fields: [
    {
      name: 'profile',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'igUserId',
      type: 'text',
      required: true,
      admin: { description: 'Instagram user id from the Graph API.' },
    },
    {
      name: 'accessToken',
      type: 'text',
      required: true,
      hooks: {
        beforeChange: [
          ({ value, operation }) =>
            encryptTokenBeforeChange({
              value,
              operation: operation as 'create' | 'update' | 'delete',
            }),
        ],
        afterRead: [({ value }) => decryptTokenAfterRead({ value })],
      },
      admin: {
        description: 'Encrypted at rest. Decryption happens in afterRead for admin/server use only.',
      },
    },
    {
      name: 'tokenExpiresAt',
      type: 'date',
      required: true,
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: { description: 'When the IG feed cache was last refreshed.' },
    },
  ],
  timestamps: true,
};
