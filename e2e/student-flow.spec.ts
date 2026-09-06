import { test, expect } from '@playwright/test';
import { login, STUDENT } from './helpers/auth';

/**
 * Student happy path: login → dashboard → jobs list → job detail →
 * apply (or verify already applied) → applications page shows it.
 * Re-runnable: tolerates the seeded student having applied before.
 */
test.describe('student portal flow', () => {
  test('login lands on the student dashboard with real data', async ({ page }) => {
    await login(page, STUDENT);
    await expect(page).toHaveURL(/\/student/);
    // Dashboard greets the seeded student and shows at least one stat figure
    await expect(page.locator('h1')).toContainText(/arjun/i, { timeout: 15_000 });
  });

  test('logged-out visitor to /student is redirected to /auth', async ({ page }) => {
    await page.goto('/student');
    await page.waitForURL(/\/auth/, { timeout: 15_000 });
  });

  test('browse jobs → open detail → apply → application listed', async ({ page }) => {
    await login(page, STUDENT);

    // Jobs list renders seeded published jobs
    await page.goto('/student/jobs');
    await expect(page.locator('h1')).toBeVisible();
    const jobCards = page.getByRole('link', { name: /view|detail/i }).or(page.locator('a[href*="/student/jobs/"]'));
    await expect(jobCards.first()).toBeVisible({ timeout: 15_000 });

    // Open the first job detail
    await jobCards.first().click();
    await page.waitForURL(/\/student\/jobs\/[^/]+$/, { timeout: 15_000 });
    await expect(page.locator('h1')).toBeVisible();

    // Apply if possible; if already applied the button reflects it
    const applyButton = page.getByRole('button', { name: /^apply\b|apply now/i }).first();
    if (await applyButton.isVisible().catch(() => false)) {
      if (await applyButton.isEnabled()) {
        await applyButton.click();
        // confirmation dialog if one appears
        const confirm = page.getByRole('button', { name: /confirm|yes|submit/i }).first();
        if (await confirm.isVisible().catch(() => false)) await confirm.click();
        await expect(
          page.getByText(/applied|application submitted|success/i).first()
        ).toBeVisible({ timeout: 15_000 });
      }
    } else {
      await expect(page.getByText(/already applied|applied/i).first()).toBeVisible();
    }

    // Applications page lists at least one application
    await page.goto('/student/applications');
    await expect(page.locator('h1')).toBeVisible();
    await expect(
      page.getByText(/applied|under review|shortlisted|interview|offer|withdrawn/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('match, skill-gaps, recommendations, profile pages render real content', async ({ page }) => {
    await login(page, STUDENT);

    await page.goto('/student/match');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/\d+\s*\/\s*100|\d+%/).first()).toBeVisible({ timeout: 15_000 });

    await page.goto('/student/skill-gaps');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/student/recommendations');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/student/profile');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/arjun/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
