import type { CollectionAfterChangeHook, CollectionConfig } from 'payload';

import {
  canCreateProfileWithCap,
  ownsProfile,
} from '../../lib/payload/access/predicates';
import { derivePressKitProviderHook } from '../../lib/payload/hooks/derive-press-kit-provider';
import { handleProfileRevalidate } from '../../lib/payload/hooks/profile-revalidate';
import { handleSlugChange } from '../../lib/payload/hooks/profile-slug-changed';
import { validateProfileSlug } from '../../lib/payload/hooks/profile-slug-validate';
import { handleStartTrialTimer } from '../../lib/payload/hooks/start-trial-timer';

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
  req,
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
  if (operation === 'create' && doc?.owner !== undefined && doc?.owner !== null) {
    await handleStartTrialTimer(
      { operation, doc: { owner: doc.owner } },
      {
        now: () => new Date(),
        findUserById: async (id) => {
          const user = await req.payload.findByID({
            collection: 'users',
            id,
            depth: 0,
            overrideAccess: true,
          });
          if (!user) return null;
          const raw = user.trialEndsAt as string | Date | null | undefined;
          const trialEndsAt =
            typeof raw === 'string'
              ? raw
              : raw && typeof (raw as Date).toISOString === 'function'
                ? (raw as Date).toISOString()
                : null;
          return { id: user.id, trialEndsAt };
        },
        updateUser: async (id, patch) => {
          await req.payload.update({
            collection: 'users',
            id,
            data: patch,
            overrideAccess: true,
          });
        },
      },
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
    // task-31 PR-B — enforce the per-plan cap (trial/pro=1, agency=10).
    create: canCreateProfileWithCap,
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
        { label: 'Paused (trial expired)', value: 'paused' },
        { label: 'Soft-released (24h reversal window)', value: 'soft-released' },
      ],
    },
    // task-32 — inactivity-driven slug reclamation. The cron stamps
    // `slugReclaimWarningAt` at Day-23 (warning sent), then
    // `slugSoftReleasedAt` at Day-30 (status flips to soft-released).
    // Day-31 finalize rotates the slug.
    {
      name: 'slugReclaimWarningAt',
      type: 'date',
      admin: {
        readOnly: true,
        description:
          'When the Day-23 inactivity warning email was sent. Cleared by the "Keep my slug" one-click action.',
      },
    },
    {
      name: 'slugSoftReleasedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description:
          'When the slug entered the 24h reversal window (Day-30). Cleared on revert; cron finalizes 24h after.',
      },
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
        { label: 'Notion', value: 'notion' },
        { label: 'MediaFire', value: 'mediafire' },
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
    {
      name: 'pressKitConsecutiveFails',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description:
          'Counter the daily cron flips status on (task-30). 2 → warning, 3 → broken. Reset to 0 on success.',
      },
    },

    // ----- Contact (PRD §6.3, task-14) -----
    {
      name: 'contactWhatsapp',
      type: 'text',
      maxLength: 50,
      admin: {
        description:
          'Public WhatsApp contact (E.164, e.g. +5511999999999). Editor canonicalizes; the public profile renders a wa.me link.',
      },
    },
    {
      name: 'contactEmail',
      type: 'text',
      maxLength: 200,
      admin: {
        description:
          'Public contact email. Defaults the contact-form destination if left empty there.',
      },
    },
    {
      name: 'contactFormEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show the contact form on the public profile. When off, only the WhatsApp / email buttons render.',
      },
    },
    {
      name: 'contactFormDestination',
      type: 'text',
      maxLength: 200,
      admin: {
        description:
          'Destination email for form submissions. Falls back to `contactEmail` when empty.',
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
        { label: 'Español', value: 'es' },
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
        { label: 'Español', value: 'es' },
      ],
      admin: {
        description:
          'Locales with published content. The public profile uses this to gate the locale toggle (task-29).',
      },
    },
  ],
  timestamps: true,
};
