import { fileURLToPath } from 'node:url';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': dirname,
      // Next.js's `server-only` is a build-time guard; under Vitest we stub it
      // so server-only modules can be unit-tested directly.
      'server-only': path.resolve(dirname, 'tests/stubs/server-only.ts'),
      // Payload config alias mirrored from tsconfig — vitest doesn't read
      // tsconfig paths automatically. Stubbed because tests inject Payload.
      '@payload-config': path.resolve(dirname, 'tests/stubs/payload-config.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
    css: false,
  },
});
