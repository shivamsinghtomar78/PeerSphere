import { test, expect } from '@playwright/test';
import { login, STUDENT, ADMIN } from './helpers/auth';

/**
 * Visual regression on the densest views — the class of bug (clipped chart
 * labels, broken layout) that axe and flow tests can't see.
 *
 * Baselines live in e2e/visual.spec.ts-snapshots/. After an INTENTIONAL UI
 * change, refresh them with:
 *   npx playwright test e2e/visual.spec.ts --update-snapshots
 *
 * The diff tolerance absorbs live data noise (dates, counts); a layout shift
 * or clipped element moves far more pixels than the threshold allows.
 */
const SCREENSHOT_OPTIONS = {
  fullPage: true,
  maxDiffPixelRatio: 0.03,
  // Charts animate in; scores tick up — give rendering a beat to settle
  timeout: 15_000,
} as const;

test.describe('visual regression @visual', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(800); // hero entrance animation
    await expect(page).toHaveScreenshot('landing.png', SCREENSHOT_OPTIONS);
  });

  test('student dashboard', async ({ page }) => {
    await login(page, STUDENT);
    await expect(page.getByText(/placement readiness/i).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('student-dashboard.png', SCREENSHOT_OPTIONS);
  });

  test('admin analytics (charts)', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/placement/analytics');
    await expect(
      page.getByRole('heading', { name: /skill deficit distribution/i })
    ).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1200); // recharts entrance animation
    await expect(page).toHaveScreenshot('admin-analytics.png', SCREENSHOT_OPTIONS);
  });

  test('admin candidate ranking', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/placement/candidates');
    await expect(page.getByText(/ranking & screening matrix/i)).toBeVisible({ timeout: 60_000 });
    // Ranking rows come from a second fetch after the drive auto-selects
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('admin-candidates.png', SCREENSHOT_OPTIONS);
  });
});
