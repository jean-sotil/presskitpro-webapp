import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

import { Admins } from './payload/collections/Admins';
import { FeaturedTracks } from './payload/collections/FeaturedTracks';
import { InstagramConnections } from './payload/collections/InstagramConnections';
import { InstagramPosts } from './payload/collections/InstagramPosts';
import { Media } from './payload/collections/Media';
import { ProfileContent } from './payload/collections/ProfileContent';
import { Profiles } from './payload/collections/Profiles';
import { SocialLinks } from './payload/collections/SocialLinks';
import { StripeWebhookEvents } from './payload/collections/StripeWebhookEvents';
import { Themes } from './payload/collections/Themes';
import { Users } from './payload/collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Admins,
    Users,
    Profiles,
    ProfileContent,
    Media,
    SocialLinks,
    FeaturedTracks,
    Themes,
    InstagramConnections,
    InstagramPosts,
    StripeWebhookEvents,
  ],
  // PRD §10 + task-29 — PT-BR is the v1 default; EN was wired since
  // task-08; ES was promoted from task-34 by user direction. The
  // `localized: true` fields on ProfileContent already exist; adding a
  // locale here is a non-destructive add (Payload backfills missing
  // rows by returning defaultLocale via `fallback: true`).
  localization: {
    locales: ['pt-BR', 'en', 'es'],
    defaultLocale: 'pt-BR',
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    schemaName: 'payload',
  }),
  sharp,
});
