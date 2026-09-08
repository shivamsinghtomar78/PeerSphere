import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers/auth';

/**
 * Admin happy path: login → dashboard → create job via wizard → publish →
 * candidates → candidate detail → record an override → history shows it.
 * Re-runnable: unique timestamped job title per run.
 */
test.describe('admin portal flow', () => {
  test('login lands on the placement dashboard with KPIs', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/placement/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });
    // at least one numeric KPI figure is rendered
    await expect(page.getByText(/^\d+/).first()).toBeVisible();
  });

  test('create job via wizard → publish → visible to students', async ({ page }) => {
    const title = `E2E Drive ${Date.now()}`;
    await login(page, ADMIN);

    await page.goto('/placement/jobs');
    await page.getByRole('button', { name: /create new job post/i }).click({ timeout: 60_000 });

    // Step 1 — company & role
    await page.getByLabel(/company name/i).fill('E2E TestCorp');
    await page.getByLabel(/job \/ role title/i).fill(title);
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 2 — eligibility
    await page.getByLabel(/minimum cgpa/i).fill('6');
    await page.getByLabel(/maximum allowed active backlogs/i).fill('2');
    await page.getByLabel(/eligible academic departments/i).fill('Computer Science');
    const deadline = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
    await page.getByLabel(/application deadline/i).fill(deadline);
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 3 — skills
    await page.getByLabel(/mandatory technical skills/i).fill('Java, SQL');
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 4 — review & create
    await page.getByRole('button', { name: /publish drive to campus/i }).click();

    // The new DRAFT job appears in the admin list — scope to ITS card only
    const card = page.locator('.grid > div').filter({ hasText: title }).first();
    await expect(card).toBeVisible({ timeout: 30_000 });

    // Publish it via the button inside that card
    await card.getByRole('button', { name: /^publish$/i }).click();
    await expect(card.getByText(/^PUBLISHED$/i)).toBeVisible({ timeout: 30_000 });

    // Anonymous public list now includes it
    const publicList = await page.request.get('/api/v1/jobs?pageSize=50');
    const json = await publicList.json();
    const items = json.data.items ?? json.data;
    expect(items.some((j: { title: string }) => j.title === title)).toBe(true);
  });

  test('candidate detail: record an override with reason → history shows it', async ({ page }) => {
    await login(page, ADMIN);

    // The candidates page auto-selects the newest published drive, which may
    // have no candidates — scan the drive selector until candidates appear.
    await page.goto('/placement/candidates');
    const driveSelect = page.locator('#drive-select');
    await expect(driveSelect).toBeVisible({ timeout: 60_000 });
    const detailLink = page.locator('a[href*="/placement/candidates/"]').first();

    const optionValues = await driveSelect.locator('option').evaluateAll((opts) =>
      (opts as HTMLOptionElement[]).map((o) => o.value).filter(Boolean)
    );
    for (const value of optionValues) {
      await driveSelect.selectOption(value);
      if (await detailLink.isVisible({ timeout: 5_000 }).catch(() => false)) break;
    }
    await expect(detailLink).toBeVisible({ timeout: 15_000 });
    await detailLink.click();
    await page.waitForURL(/\/placement\/candidates\/[^/]+$/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 60_000 });

    const overrideButton = page.getByRole('button', { name: /override decision/i });
    await expect(overrideButton).toBeVisible();
    await overrideButton.click();

    // reason required: submit disabled while empty
    const submit = page.getByRole('button', { name: /record override/i });
    await expect(submit).toBeDisabled();

    const reason = `E2E override ${Date.now()} — verified portfolio quality`;
    await page.locator('#override-reason').fill(reason);
    await page.locator('#override-decision').selectOption('review');
    await submit.click();

    // history card lists the new override
    await expect(page.getByText(reason)).toBeVisible({ timeout: 30_000 });
  });
});
