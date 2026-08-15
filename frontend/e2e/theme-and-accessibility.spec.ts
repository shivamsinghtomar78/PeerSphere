import { test, expect } from '@playwright/test';

test.describe('Theme System, Accessibility & Mobile Navigation', () => {
  test('Light and Dark Mode toggle on Chrome', async ({ page }) => {
    await page.goto('/');

    // Toggle theme button (group on landing page)
    const darkBtn = page.getByRole('button', { name: 'Dark mode' });
    await expect(darkBtn).toBeVisible();

    // Click dark mode
    await darkBtn.click();
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Click light mode
    const lightBtn = page.getByRole('button', { name: 'Light mode' });
    await lightBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
  });

  test('Non-color status indicators present across UI', async ({ page }) => {
    await page.goto('/student/match');

    // Verify non-color symbols are rendered
    await expect(page.locator('text=✓').first()).toBeVisible();
    await expect(page.locator('text=✕').first()).toBeVisible();
  });

  test('Mobile Bottom Navigation active on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/student');

    // Desktop sidebar should be hidden on mobile
    const desktopSidebar = page.locator('aside');
    await expect(desktopSidebar).toBeHidden();

    // Mobile bottom navigation should be visible
    const bottomNav = page.locator('nav[aria-label="Primary navigation"]');
    await expect(bottomNav).toBeVisible();

    // Tap on Jobs in bottom nav
    await bottomNav.getByRole('link', { name: 'Jobs' }).click();
    await expect(page).toHaveURL(/\/student\/jobs/);
  });
});
