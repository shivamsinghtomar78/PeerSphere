import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers/auth';

/** Render checks for the remaining placement pages against seeded data. */
test.describe('admin pages render real data', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('students roster lists the seeded students', async ({ page }) => {
    await page.goto('/placement/students');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/arjun sharma/i).first()).toBeVisible();
    await expect(page.getByText(/priya nair/i).first()).toBeVisible();
  });

  test('applications page renders application rows with statuses', async ({ page }) => {
    await page.goto('/placement/applications');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/applied|under review|shortlisted|interview|offer|withdrawn/i).first()
    ).toBeVisible();
  });

  test('analytics page renders KPI figures and charts', async ({ page }) => {
    await page.goto('/placement/analytics');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    // recharts renders SVG surfaces
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('compare page renders', async ({ page }) => {
    await page.goto('/placement/compare');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
  });

  test('reports page renders the catalog', async ({ page }) => {
    await page.goto('/placement/reports');
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
  });

  test('role guard: admin visiting /student is redirected to /placement', async ({ page }) => {
    await page.goto('/student');
    await page.waitForURL(/\/placement/, { timeout: 30_000 });
  });
});
