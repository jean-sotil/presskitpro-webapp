import type { CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsViaProfile,
} from '../../lib/payload/access/predicates';

/**
 * Featured Instagram posts (manual paste flow, task-17).
 *
 * One row per featured post; up to 6 per profile (enforced server-side
 * by the `instagram-posts-reconcile` helper, plus a client-side cap in
 * the editor UI). The Graph-API auto-pull is task-34 (v2) and uses the
 * separate `InstagramConnections` collection — these two never overlap.
 *
 * `oembedHtml` caches the embed HTML (either the Graph oEmbed iframe or
 * a server-built `<blockquote class="instagram-media">`, depending on
 * whether `INSTAGRAM_OEMBED_ACCESS_TOKEN` is set). Decision-doc 0002
 * documents the dispatch strategy.
 */
export const InstagramPosts: CollectionConfig = {
  slug: 'instagram-posts',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['profile', 'displayOrder', 'url', 'fetchedAt'],
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
      index: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      maxLength: 500,
    },
    {
      name: 'oembedHtml',
      type: 'textarea',
      admin: {
        description:
          'Sanitized embed HTML — either Graph-oEmbed iframe or our blockquote fallback. Refreshed by the editor.',
        readOnly: true,
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower = earlier on the public profile.' },
    },
    {
      name: 'fetchedAt',
      type: 'date',
      admin: {
        description: 'When the embed cache was last refreshed.',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
