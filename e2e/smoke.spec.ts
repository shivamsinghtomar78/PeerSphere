import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('landing page renders hero, explainability showcase, and role CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/never black-box/i);
    await expect(page.getByRole('link', { name: /enter as student/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /enter as placement officer/i })).toBeVisible();
    // The hero StageShow visual is an interactive score breakdown
    await expect(page.getByText(/InnovateTech Solutions/i).first()).toBeVisible();
    await expect(page.getByText(/CGPA 8\.42 ≥ 7\.50/)).toBeVisible();
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
