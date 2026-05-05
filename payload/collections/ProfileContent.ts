import type { CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsViaProfile,
} from '../../lib/payload/access/predicates';

/**
 * Localized content for each Profile (1:1).
 *
 * Per PRD §7, this is the editorial copy that varies by locale: tagline,
 * bio, services list, SEO meta. Payload's `localized: true` on each field
 * stores per-locale values internally; the `locale` query parameter on
 * reads selects which one is returned.
 *
 * Locale set is configured at `payload.config.ts → localization.locales`.
 * Defaults to `pt-BR` (PRD §10 "Phase 1: PT only").
 */
export const ProfileContent: CollectionConfig = {
  slug: 'profile-content',
  admin: {
    useAsTitle: 'tagline',
    defaultColumns: ['profile', 'tagline', 'updatedAt'],
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
      name: 'tagline',
      type: 'text',
      localized: true,
      maxLength: 140,
    },
    {
      name: 'bio',
      type: 'richText',
      localized: true,
    },
    {
      name: 'services',
      type: 'array',
      localized: true,
      labels: { singular: 'Service', plural: 'Services' },
      fields: [
        { name: 'title',       type: 'text', required: true, maxLength: 80 },
        { name: 'description', type: 'textarea', maxLength: 240 },
      ],
    },
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      maxLength: 70,
      admin: { description: 'SEO <title>. Falls back to display name + tagline if empty.' },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      maxLength: 160,
    },
    {
      name: 'ogImage',
      type: 'relationship',
      relationTo: 'media',
      localized: true,
      admin: { description: 'Open Graph image. Falls back to hero portrait if empty.' },
    },
  ],
  timestamps: true,
};
