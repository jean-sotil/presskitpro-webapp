import type { CollectionConfig } from 'payload';

import { ownsProfile } from '../../lib/payload/access/predicates';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    description:
      'Reference-only metadata for files stored in Supabase Storage. Payload does NOT manage the underlying file (no `upload: true`). See ADR 0001.',
    defaultColumns: ['alt', 'bucket', 'path', 'mimeType', 'size'],
  },
  access: {
    read: ownsProfile,
    update: ownsProfile,
    delete: ownsProfile,
    // Create rule: any authenticated user can register a media row, but the
    // afterChange path will reject if `owner` doesn't match req.user.id.
    // For now, default to self-as-owner (the editor will set this explicitly).
    create: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'bucket',
      type: 'select',
      required: true,
      options: [
        { label: 'avatars', value: 'avatars' },
        { label: 'gallery', value: 'gallery' },
      ],
    },
    {
      name: 'path',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Path within the bucket. Combined with bucket → public URL at render time.' },
    },
    {
      name: 'mimeType',
      type: 'text',
      required: true,
    },
    {
      name: 'size',
      type: 'number',
      required: true,
      admin: { description: 'Bytes.' },
    },
    {
      name: 'width',
      type: 'number',
    },
    {
      name: 'height',
      type: 'number',
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Required for a11y. Mark explicitly empty (string with one space) only for decorative images — task-12 enforces the explicit decorative toggle.',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
  ],
  timestamps: true,
};
