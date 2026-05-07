import { withPayload } from '@payloadcms/next/withPayload';
import { createRequire } from 'node:module';
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
};

// Bundle analyzer is opt-in via `ANALYZE=1 bun run build` (task-26). The
// dep is loaded lazily so the regular build never resolves it — devs can
// run `bun run build` without `@next/bundle-analyzer` installed.
function withBundleAnalyzerOptional(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== '1' && process.env.ANALYZE !== 'true') return config;
  const require = createRequire(import.meta.url);
  const factory = require('@next/bundle-analyzer') as (
    options: { enabled: boolean },
  ) => (next: NextConfig) => NextConfig;
  return factory({ enabled: true })(config);
}

export default withPayload(
  withNextIntl(withBundleAnalyzerOptional(nextConfig)),
  { devBundleServerPackages: false },
);
