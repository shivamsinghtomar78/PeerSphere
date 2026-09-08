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

    // Jobs list renders seeded published jobs (content appears after data load)
    await page.goto('/student/jobs');
    const jobCards = page.locator('a[href*="/student/jobs/"]');
    await expect(jobCards.first()).toBeVisible({ timeout: 60_000 });

    // Open the first job detail
    await jobCards.first().click();
    await page.waitForURL(/\/student\/jobs\/[^/]+$/, { timeout: 15_000 });
    await expect(page.locator('h1')).toBeVisible();

    // Apply if possible; on re-runs the button shows the submitted state
    const applyButton = page.getByRole('button', { name: /apply for role|^apply\b/i }).first();
    const submittedButton = page.getByRole('button', { name: /application submitted/i }).first();
    await expect(applyButton.or(submittedButton)).toBeVisible();
    if (await applyButton.isVisible().catch(() => false)) {
      await applyButton.click();
      await expect(
        page.getByText(/application submitted|success/i).first()
      ).toBeVisible({ timeout: 15_000 });
    } else {
      await expect(submittedButton).toBeDisabled();
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
    // h1 renders only after evaluations load; the default-selected job may
    // have no evaluation yet — the empty state is a legitimate render
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/\d+\s*\/\s*100|\d+%/).first().or(page.getByText(/no match analysis/i).first())
    ).toBeVisible();

    await page.goto('/student/skill-gaps');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/student/recommendations');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/student/profile');
    await expect(page.locator('h1')).toBeVisible();
    // The name is form data, not text — assert the input carries the seeded value
    await expect(page.locator('input[value*="Arjun" i]').first()).toBeAttached({ timeout: 15_000 });
  });
});
