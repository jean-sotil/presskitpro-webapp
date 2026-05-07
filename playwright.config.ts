import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

/**
 * Playwright configuration.
 *
 * - Local dev: spins up `bun run dev` automatically and reuses an existing server.
 * - CI: starts `bun run start` against the production build (separate workflow
 *   step builds first, then runs tests against the running server).
 *
 * Smoke-only on PR (this default config); full suite is opted into via
 * `--grep @full` or running on `main`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['html', { open: 'never' }], ['list']]
    : [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    // Task-29 — pin the browser locale so `Accept-Language` defaults to
    // the PRD-default PT-BR. Chromium otherwise ships `en-US` and our
    // negotiator correctly resolves to `en`, breaking specs that
    // assume PT. Specs that need a non-PT locale set the `NEXT_LOCALE`
    // cookie explicitly via `context.addCookies`.
    locale: 'pt-BR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: isCI ? 'bun run start' : 'bun run dev',
        url: 'http://localhost:3000',
        timeout: 120_000,
        reuseExistingServer: !isCI,
      },
});
