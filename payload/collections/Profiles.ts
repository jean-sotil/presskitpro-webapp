import type { CollectionAfterChangeHook, CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsProfile,
} from '../../lib/payload/access/predicates';
import { derivePressKitProviderHook } from '../../lib/payload/hooks/derive-press-kit-provider';
import { handleProfileRevalidate } from '../../lib/payload/hooks/profile-revalidate';
import { handleSlugChange } from '../../lib/payload/hooks/profile-slug-changed';
import { validateProfileSlug } from '../../lib/payload/hooks/profile-slug-validate';

// `lib/supabase/admin.ts` imports `server-only`, which Next provides at
// build-time but the Payload CLI (tsx) cannot resolve. Loading it lazily
// inside the hook keeps `pnpm payload generate:types` / `migrate:create`
// working while preserving the runtime guard inside the Next app.
const loadSupabaseAdmin = async () =>
  (await import('../../lib/supabase/admin')).supabaseAdmin();

/**
 * Per PRD §7. Press-kit fields are derived from the URL by a beforeChange
 * hook (`derive-press-kit-provider.ts`); never accept them as raw user
 * input. Health-status updates land in task-30 (daily cron). Slug grammar
 * is enforced by the validate hook from task-07.
 */
const profileAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
}) => {
  if (operation === 'update' && previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    await handleSlugChange(
      {
        operation,
        doc: { slug: doc?.slug },
        previousDoc: { slug: previousDoc.slug },
      },
      { supabase: await loadSupabaseAdmin() },
    );
  }
  handleProfileRevalidate({
    operation,
    doc: { slug: doc?.slug, status: doc?.status },
    previousDoc: previousDoc
      ? { slug: previousDoc.slug, status: previousDoc.status }
      : undefined,
  });
  return doc;
};

export const Profiles: CollectionConfig = {
  slug: 'profiles',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'status', 'owner', 'updatedAt'],
  },
  access: {
    read: ownsProfile,
    update: ownsProfile,
    delete: ownsProfile,
    create: canCreateForOwnedProfile,
  },
  hooks: {
    beforeChange: [derivePressKitProviderHook],
    afterChange: [profileAfterChange],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateProfileSlug as never,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Unpublished', value: 'unpublished' },
      ],
    },

    // ----- Hero media (PRD §6.3) -----
    // Optional: the wizard (task-06) lets users skip uploads; the editor
    // (task-09 / task-10 hero section) is where they refine.
    {
      name: 'portrait',
      type: 'relationship',
      relationTo: 'media',
      admin: { description: 'Hero portrait. Renders on the public profile.' },
    },
    {
      name: 'logo',
      type: 'relationship',
      relationTo: 'media',
      admin: { description: 'Optional artist logo / monogram.' },
    },

    // ----- Photo gallery (PRD §6.3) -----
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      maxRows: 50,
      admin: {
        description:
          'Gallery photos (drag-reorder in the editor). Max 50 (soft warn at 24).',
      },
    },

    // ----- Press kit (PRD §7) -----
    {
      name: 'pressKitUrl',
      type: 'text',
      maxLength: 500,
      admin: {
        description:
          'External press-kit URL (Google Drive, Dropbox, etc.). Provider + health are derived/checked automatically.',
      },
    },
    {
      name: 'pressKitProvider',
      type: 'select',
      defaultValue: 'unknown',
      options: [
        { label: 'Unknown', value: 'unknown' },
        { label: 'Google Drive', value: 'google-drive' },
        { label: 'Dropbox', value: 'dropbox' },
        { label: 'OneDrive', value: 'onedrive' },
        { label: 'WeTransfer', value: 'wetransfer' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        readOnly: true,
        description: 'Derived from `pressKitUrl` by beforeChange hook.',
      },
    },
    {
      name: 'pressKitLastCheckedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Updated by the daily health-check cron (task-30).',
      },
    },
    {
      name: 'pressKitHealthStatus',
      type: 'select',
      defaultValue: 'unknown',
      options: [
        { label: 'Unknown', value: 'unknown' },
        { label: 'Healthy', value: 'healthy' },
        { label: 'Warning', value: 'warning' },
        { label: 'Broken', value: 'broken' },
      ],
      admin: {
        readOnly: true,
        description: 'Set by the daily cron (task-30).',
      },
    },

    // ----- Localization metadata (PRD §10) -----
    {
      name: 'defaultLocale',
      type: 'select',
      required: true,
      defaultValue: 'pt-BR',
      options: [
        { label: 'Português (Brasil)', value: 'pt-BR' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      name: 'localesAvailable',
      type: 'select',
      hasMany: true,
      defaultValue: ['pt-BR'],
      options: [
        { label: 'Português (Brasil)', value: 'pt-BR' },
        { label: 'English', value: 'en' },
      ],
      admin: {
        description:
          'Locales with published content. The public profile uses this to gate the locale toggle (task-19).',
      },
    },
  ],
  timestamps: true,
};
