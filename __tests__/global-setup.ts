/**
 * Jest global setup: reset the TEST database to a known state.
 * Applies migrations and runs the idempotent seed against DATABASE_URL from
 * .env.test — never against .env (the real database).
 */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function globalSetup(): void {
  const root = join(__dirname, '..');
  let testDbUrl: string | undefined;
  try {
    const envFile = readFileSync(join(root, '.env.test'), 'utf8');
    testDbUrl = envFile.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)?.[1];
  } catch {
    // no .env.test — skip DB preparation (unit tests only)
  }

  if (!testDbUrl) {
    console.warn('[global-setup] No .env.test DATABASE_URL — skipping test-DB reset');
    return;
  }
  if (!/test/i.test(testDbUrl)) {
    throw new Error('[global-setup] Refusing: .env.test DATABASE_URL does not look like a test DB');
  }

  const env = { ...process.env, DATABASE_URL: testDbUrl };
  execSync('npx prisma migrate deploy', { cwd: root, env, stdio: 'pipe' });
  execSync('npx tsx prisma/seed.ts', { cwd: root, env, stdio: 'pipe' });
  console.log('[global-setup] Test DB migrated + seeded');
}
