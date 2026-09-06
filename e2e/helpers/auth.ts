import { Page, expect } from '@playwright/test';

export const STUDENT = { email: 'arjun.sharma@college.edu', password: 'student123', role: 'Student' };
export const ADMIN = { email: 'placement@college.edu', password: 'admin123', role: 'Placement Officer' };

/**
 * Logs in through the real /auth UI (role card → credentials form)
 * and waits for the portal to load.
 */
export async function login(page: Page, who: { email: string; password: string; role: string }): Promise<void> {
  await page.goto('/auth');
  // Step 1: pick the role card
  await page.getByRole('button', { name: new RegExp(who.role, 'i') }).first().click();
  // Step 2: credentials
  const emailInput = page.getByLabel(/email/i);
  await emailInput.waitFor();
  await emailInput.fill(who.email);
  await page.getByLabel(/^password$/i).fill(who.password);
  await page.getByRole('button', { name: /sign in|log ?in/i }).click();
  // Generous: dev-server first compile of a portal page + Neon cold start
  await page.waitForURL(/\/(student|placement)/, { timeout: 60_000 });
  await expect(page.locator('body')).toBeVisible();
}
