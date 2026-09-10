import { defineConfig, devices } from '@playwright/test';

/**
 * E2e suite. Boots its own dev server on port 3100 (other projects on this
 * machine commonly occupy 3000/3001) against the DATABASE_URL in .env —
 * run `npm run db:seed` first (idempotent) so demo logins exist.
 *
 * To test an ALREADY-RUNNING server instead (Next allows only one dev server
 * per project), point E2E_BASE_URL at it:
 *   $env:E2E_BASE_URL="http://localhost:3000"; npx playwright test --headed
 */
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  // Pages gate content behind data loads; Neon cold-start + dev first-compile
  // can take >15s, so assertions get a generous default.
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // With E2E_BASE_URL set, tests run against that server — no webServer boot
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev -- -p 3100',
        url: 'http://localhost:3100',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
