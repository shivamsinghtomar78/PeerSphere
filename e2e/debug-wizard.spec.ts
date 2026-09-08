import { test } from '@playwright/test';
import { login, ADMIN } from './helpers/auth';

test('DEBUG wizard create', async ({ page }) => {
  const logs: string[] = [];
  page.on('response', async (r) => {
    if (r.url().includes('/api/') && r.request().method() === 'POST') {
      const body = await r.text().catch(() => '');
      logs.push(`[api] ${r.status()} POST ${r.url()} → ${body.slice(0, 400)}`);
    }
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`));

  await login(page, ADMIN);
  await page.goto('/placement/jobs');
  await page.getByRole('button', { name: /create new job post/i }).click({ timeout: 60_000 });
  await page.getByLabel(/company name/i).fill('E2E TestCorp');
  await page.getByLabel(/job \/ role title/i).fill(`Debug Drive ${Date.now()}`);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByLabel(/minimum cgpa/i).fill('6');
  await page.getByLabel(/maximum allowed active backlogs/i).fill('2');
  await page.getByLabel(/eligible academic departments/i).fill('Computer Science');
  const deadline = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  await page.getByLabel(/application deadline/i).fill(deadline);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByLabel(/mandatory technical skills/i).fill('Java, SQL');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /publish drive to campus/i }).click();
  await page.waitForTimeout(8_000);
  console.log('\n===== CAPTURED =====\n' + (logs.join('\n') || '(nothing)'));
});
