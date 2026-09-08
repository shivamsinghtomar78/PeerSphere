import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login, STUDENT, ADMIN } from './helpers/auth';

/**
 * Axe scans: zero critical/serious violations on the landing page,
 * two student pages, and two admin pages — plus GlassDialog keyboard checks.
 */
async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const serious = results.violations.filter((v) =>
    ['critical', 'serious'].includes(v.impact ?? '')
  );
  expect(
    serious.map(
      (v) =>
        `${v.id}: ${v.nodes
          .slice(0, 4)
          .map((n) => n.html.slice(0, 120))
          .join(' || ')}`
    ),
    'critical/serious axe violations'
  ).toEqual([]);
}

test.describe('accessibility scans', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('student dashboard + jobs', async ({ page }) => {
    await login(page, STUDENT);
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await expectNoSeriousViolations(page);

    await page.goto('/student/jobs');
    await expect(page.locator('a[href*="/student/jobs/"]').first()).toBeVisible({ timeout: 60_000 });
    await expectNoSeriousViolations(page);
  });

  test('admin dashboard + candidates', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await expectNoSeriousViolations(page);

    await page.goto('/placement/candidates');
    await expect(page.locator('#drive-select')).toBeVisible({ timeout: 60_000 });
    await expectNoSeriousViolations(page);
  });

  test('GlassDialog keyboard: opens, Escape closes', async ({ page }) => {
    const title = 'kbd-check';
    await login(page, ADMIN);
    await page.goto('/placement/jobs');
    await page.getByRole('button', { name: /create new job post/i }).click({ timeout: 60_000 });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Escape closes
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    void title;
  });
});
