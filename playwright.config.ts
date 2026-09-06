import { defineConfig, devices } from '@playwright/test';

/**
 * E2e suite. Boots its own dev server on port 3100 (other projects on this
 * machine commonly occupy 3000/3001) against the DATABASE_URL in .env —
 * run `npm run db:seed` first (idempotent) so demo logins exist.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
