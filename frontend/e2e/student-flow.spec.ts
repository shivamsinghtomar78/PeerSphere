import { test, expect } from '@playwright/test';

test.describe('Student Portal & Flows', () => {
  test('Landing page and navigation to Student Workspace', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PeerSphere/);
    await expect(page.locator('h1')).toContainText('Placement Matching');

    // Click on Student Portal
    await page.getByRole('link', { name: /Enter Student Experience/i }).click();
    await expect(page).toHaveURL(/\/student/);
  });

  test('Student Dashboard Bento Grid verification', async ({ page }) => {
    await page.goto('/student');

    // Verify key readiness and stats
    await expect(page.getByText('Placement Readiness')).toBeVisible();
    await expect(page.getByText('82%')).toBeVisible();
    await expect(page.getByText('Top Recommendation')).toBeVisible();
    await expect(page.getByText('Active Improvement Track')).toBeVisible();

    // Verify Bento cards exist
    const cards = page.locator('.surface, .surface-raised');
    expect(await cards.count()).toBeGreaterThan(3);
  });

  test('Student Jobs directory search, filter, and detail flow', async ({ page }) => {
    await page.goto('/student/jobs');

    await expect(page.locator('h1')).toContainText('Campus Placement Openings');
    await expect(page.getByText('ABC Technologies').first()).toBeVisible();

    // Search for Backend
    const searchInput = page.getByPlaceholder(/Search by job title/i);
    await searchInput.fill('Backend');
    await expect(page.getByRole('heading', { name: 'Backend Developer' }).first()).toBeVisible();

    // Navigate to Job Detail
    await page.getByRole('link', { name: 'View Details' }).first().click();
    await expect(page).toHaveURL(/\/student\/jobs\/job-001/);

    // Check Job detail sections
    await expect(page.getByRole('heading', { name: 'About the Role' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skill Requirements' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eligibility Criteria' })).toBeVisible();
    await expect(page.getByText('Resume vs Job Requirements Matrix')).toBeVisible();

    // Test Apply interaction
    const applyBtn = page.getByRole('button', { name: /Apply for Role/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await expect(page.getByText('Application Submitted ✓')).toBeVisible();
    }
  });

  test('Student Match Analysis and Skill Gap inspection', async ({ page }) => {
    await page.goto('/student/match');

    await expect(page.locator('h1')).toContainText('AI Match & Gap Analysis');
    await expect(page.getByText('Overall AI Match Score')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Skill Match Categorization' })).toBeVisible();
    await expect(page.getByText('Strong Matches').first()).toBeVisible();
    await expect(page.getByText('Missing Gaps').first()).toBeVisible();

    // Navigate to Skill Gaps
    await page.getByRole('link', { name: /Inspect Skill Gaps/i }).first().click();
    await expect(page).toHaveURL(/\/student\/skill-gaps/);

    // Expand Spring Boot gap
    await expect(page.getByText('Spring Boot').first()).toBeVisible();
    await page.getByText('Spring Boot').first().click();
    await expect(page.getByText('Why It Matters').first()).toBeVisible();
    await expect(page.getByText('Improvement Steps').first()).toBeVisible();
  });

  test('Student Roadmap, Applications, and Profile update', async ({ page }) => {
    // 1. Roadmap
    await page.goto('/student/recommendations');
    await expect(page.locator('h1')).toContainText('Improvement Roadmap');
    await expect(page.getByText('Milestone Roadmap').first()).toBeVisible();

    // 2. Applications
    await page.goto('/student/applications');
    await expect(page.locator('h1')).toContainText('My Applications');
    await expect(page.getByText('ABC Technologies').first()).toBeVisible();

    // 3. Profile
    await page.goto('/student/profile');
    await expect(page.locator('h1')).toContainText('Profile & Resume Management');
    await expect(page.getByLabel('Full Name')).toHaveValue('Arjun Sharma');

    // Add a skill test
    const skillInput = page.getByPlaceholder(/Add skill/i);
    await skillInput.fill('Kubernetes');
    await page.getByRole('button', { name: /\+ Add/i }).click();
    await expect(page.getByText('Kubernetes')).toBeVisible();

    // Save
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.getByText('Changes Saved ✓')).toBeVisible();
  });
});
