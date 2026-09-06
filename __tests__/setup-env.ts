// Loads .env.test (if present) so integration tests hit the disposable test DB,
// and provides deterministic secrets for suites that don't set their own.
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envFile = readFileSync(join(__dirname, '..', '.env.test'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"#]*)"?\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim();
    }
  }
} catch {
  // .env.test is optional; unit tests don't need it
}

process.env.JWT_SECRET ??= 'test-jwt-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789abcdef01234567';
