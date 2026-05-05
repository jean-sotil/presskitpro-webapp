import type { CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsViaProfile,
} from '../../lib/payload/access/predicates';

/**
 * One featured audio track per Profile (typically a SoundCloud embed).
 *
 * `oembedHtml` caches the provider's HTML response so we don't hammer
 * the oEmbed endpoint on every public-profile render. The cache is
 * refreshed when `fetchedAt` is older than the staleness window
 * (task-16 wires the refresh job).
 */
export const FeaturedTracks: CollectionConfig = {
  slug: 'featured-tracks',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['profile', 'provider', 'url', 'fetchedAt'],
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
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'soundcloud',
      options: [
        { label: 'SoundCloud', value: 'soundcloud' },
      ],
      admin: { description: 'Other providers (Spotify, Bandcamp) land in v2.' },
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
        description: 'Cached oEmbed HTML. Refreshed when stale (task-16).',
        readOnly: true,
      },
    },
    {
      name: 'fetchedAt',
      type: 'date',
      admin: {
        description: 'When the oEmbed cache was last refreshed.',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
