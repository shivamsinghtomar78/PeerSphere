import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('landing page renders hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/placement matching/i);
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('auth flow: role selection reveals the login form', async ({ page }) => {
    await page.goto('/auth');
    // Step 1: role cards
    const studentCard = page.getByRole('button', { name: /student/i }).first();
    await expect(studentCard).toBeVisible();
    await studentCard.click();
    // Step 2: credentials form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log ?in/i })).toBeVisible();
  });
});
