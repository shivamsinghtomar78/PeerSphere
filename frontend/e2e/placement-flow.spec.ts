import { test, expect } from '@playwright/test';

test.describe('Placement Officer Console & Operations', () => {
  test('Placement Dashboard KPI and Bento cards', async ({ page }) => {
    await page.goto('/placement');

    await expect(page.locator('h1')).toContainText('Placement Cell Operations');
    await expect(page.getByText('Registered Students')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Campus Drives' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Campus Skill Gaps' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Screening Quality & Governance' })).toBeVisible();
  });

  test('Student Roster table and filtering', async ({ page }) => {
    await page.goto('/placement/students');

    await expect(page.locator('h1')).toContainText('Student Roster & Profiles');
    await expect(page.getByText('Arjun Sharma')).toBeVisible();
    await expect(page.getByText('Priya Nair')).toBeVisible();

    // Test Search
    const searchInput = page.getByPlaceholder(/Search student by name/i);
    await searchInput.fill('Priya');
    await expect(page.getByText('Priya Nair')).toBeVisible();
    await expect(page.getByText('Arjun Sharma')).not.toBeVisible();
  });

  test('Multi-step Job Creation Wizard', async ({ page }) => {
    await page.goto('/placement/jobs');

    await expect(page.locator('h1')).toContainText('Campus Placement Drives');
    await page.getByRole('button', { name: /\+ Create New Job Post/i }).click();

    // Step 1
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/Company Name/i).fill('FinTech Global');
    await page.getByLabel(/Job \/ Role Title/i).fill('Senior Frontend Architect');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 2
    await page.getByLabel(/Minimum CGPA/i).fill('8.0');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 3
    await page.getByLabel(/Mandatory Technical Skills/i).fill('React, TypeScript, Next.js');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 4: Publish
    await expect(page.getByText('FinTech Global')).toBeVisible();
    await page.getByRole('button', { name: /Publish Drive/i }).click();

    // Verify published card appears
    await expect(page.getByText('FinTech Global')).toBeVisible();
  });

  test('Candidate Ranking, Shortlisting, and Detail view', async ({ page }) => {
    await page.goto('/placement/candidates');

    await expect(page.locator('h1')).toContainText('Candidate Ranking');
    await expect(page.getByText('Priya Nair').first()).toBeVisible();
    await expect(page.getByText('Arjun Sharma').first()).toBeVisible();

    // Toggle Shortlist on Arjun
    const shortlistBtn = page.getByRole('button', { name: /^Shortlist$/i }).first();
    if (await shortlistBtn.isVisible()) {
      await shortlistBtn.click();
      await expect(page.getByText('Shortlisted ✓').first()).toBeVisible();
    }

    // Inspect Candidate Detail
    await page.getByRole('link', { name: 'Inspect' }).first().click();
    await expect(page).toHaveURL(/\/placement\/candidates\//);
    await expect(page.getByRole('heading', { name: 'Skill Matching Categorization' })).toBeVisible();
    await expect(page.getByText('Resume vs Job Requirements Matrix')).toBeVisible();
  });

  test('Side-by-Side Candidate Comparison Matrix', async ({ page }) => {
    await page.goto('/placement/compare');

    await expect(page.locator('h1')).toContainText('Candidate Comparison');
    await expect(page.getByText('Priya Nair').first()).toBeVisible();
    await expect(page.getByText('Arjun Sharma').first()).toBeVisible();
    await expect(page.getByText('Rohan Mehta').first()).toBeVisible();
    await expect(page.getByText('AI Match Score')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Spring Boot', exact: true })).toBeVisible();
  });

  test('Placement Analytics and Institutional Reports', async ({ page }) => {
    // Analytics
    await page.goto('/placement/analytics');
    await expect(page.locator('h1')).toContainText('Placement Intelligence');
    await expect(page.getByRole('heading', { name: 'Campus-Wide Skill Deficit Distribution' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Department Cohort Readiness' })).toBeVisible();

    // Reports
    await page.goto('/placement/reports');
    await expect(page.locator('h1')).toContainText('Placement Reports & Audit Trails');
    await expect(page.getByText('Curriculum Intervention Report')).toBeVisible();
    await expect(page.getByText('Compliance Audit Log')).toBeVisible();
  });
});
