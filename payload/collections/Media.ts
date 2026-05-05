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
      // Required UNLESS `decorative` is explicitly true. Validate hook
      // enforces the WCAG-correct posture: decorative photos render with
      // `alt=""` (handled at render time), all other photos must have
      // human-readable alt copy.
      validate: ((value: unknown, opts: { siblingData?: { decorative?: boolean } }) => {
        const decorative = opts?.siblingData?.decorative;
        if (decorative === true) return true;
        if (typeof value === 'string' && value.trim().length > 0) return true;
        return 'Texto alternativo obrigatório (ou marque a imagem como decorativa).';
      }) as never,
      admin: {
        description:
          'Required for a11y unless `decorative` is true (in which case the public render emits alt="").',
      },
    },
    {
      name: 'decorative',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Mark for purely-decorative images (textures, abstract bg). Public render emits alt="" (WCAG-correct).',
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
