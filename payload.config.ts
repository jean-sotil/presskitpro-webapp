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
  // PRD §10 — Phase 1 ships PT-BR. EN is configured now so task-29 doesn't
  // have to retrofit every collection. `fallback: true` returns defaultLocale
  // for missing-locale lookups; the public profile route (task-19) must
  // check `Profiles.localesAvailable` before linking to a locale toggle.
  localization: {
    locales: ['pt-BR', 'en'],
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
