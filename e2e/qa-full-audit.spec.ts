import { test, expect, type Page } from '@playwright/test';
import { login, STUDENT, ADMIN } from './helpers/auth';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

async function assertCleanPage(page: Page, consoleErrors: string[], pageErrors: string[]) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
  });
  expect(overflow, `Horizontal overflow detected on ${page.url()}`).toBe(false);

  const brokenImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter((img) => {
        const style = window.getComputedStyle(img);
        return style.display !== 'none' && img.getAttribute('src') && !img.complete;
      })
      .map((img) => img.getAttribute('src'));
  });
  expect(brokenImages, `Broken images on ${page.url()}`).toEqual([]);
  expect(pageErrors, `Uncaught page errors on ${page.url()}`).toEqual([]);
  expect(consoleErrors, `Console errors on ${page.url()}`).toEqual([]);
}

test.describe('Full PeerSphere Playwright QA & Responsive Audit', () => {
  test('Landing page StageShow, Bento cards, FAQ, and responsive viewports', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Hero StageShow perspective toggle
    await page.getByRole('tab', { name: 'Officer View' }).click();
    await expect(page.getByText(/Arjun Sharma · Rank #1/i)).toBeVisible();
    await page.getByRole('tab', { name: 'Student View' }).click();
    await expect(page.getByText(/InnovateTech Solutions/i).first()).toBeVisible();

    // Walkthrough tab switcher (Student Loop <-> Officer Override)
    await page.getByRole('tab', { name: 'Officer Audited Override' }).click();
    await expect(page.getByText(/Candidate Ranking — SDE Drive/i)).toBeVisible();
    await page.getByRole('tab', { name: 'Student Skill-Gap Loop' }).click();

    // FAQ accordion
    const faqBtn = page.getByRole('button', { name: /Can placement officers override/i });
    await faqBtn.click();
    await expect(page.getByText(/appended to the audit trail/i).first()).toBeVisible();

    // Multi-viewport layout & overflow check
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(150);
      await assertCleanPage(page, consoleErrors, pageErrors);
    }
  });

  test('Auth validation errors and invalid credentials handling', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /student/i }).first().click();
    const passwordInput = page.getByLabel(/^password$/i);
    await passwordInput.fill('wrongpass123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });

  test('Student portal all routes render cleanly across desktop and mobile', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page, STUDENT);

    const studentRoutes = [
      '/student',
      '/student/jobs',
      '/student/match',
      '/student/skill-gaps',
      '/student/recommendations',
      '/student/applications',
      '/student/profile',
    ];

    for (const route of studentRoutes) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1, { timeout: 15_000 });
      await assertCleanPage(page, consoleErrors, pageErrors);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150);
      await assertCleanPage(page, consoleErrors, pageErrors);
    }
  });

  test('Placement officer portal all routes render cleanly across desktop and mobile', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page, ADMIN);

    const adminRoutes = [
      '/placement',
      '/placement/students',
      '/placement/jobs',
      '/placement/applications',
      '/placement/candidates',
      '/placement/compare',
      '/placement/analytics',
      '/placement/reports',
    ];

    for (const route of adminRoutes) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1, { timeout: 15_000 });
      await assertCleanPage(page, consoleErrors, pageErrors);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(150);
      await assertCleanPage(page, consoleErrors, pageErrors);
    }
  });
});
