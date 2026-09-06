/**
 * Fail-fast auth environment configuration.
 * The app must refuse to boot without real secrets — no silent fallbacks.
 */

const MIN_SECRET_LENGTH = 32;

function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Generate one with: openssl rand -hex 32 (see .env.example)`
    );
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return value;
}

export const JWT_SECRET = requireSecret('JWT_SECRET');
export const JWT_REFRESH_SECRET = requireSecret('JWT_REFRESH_SECRET');

/** Parses "15m" / "7d" / "3600" style durations to seconds. */
export function parseDurationSeconds(raw: string | undefined, fallbackSeconds: number): number {
  if (!raw) return fallbackSeconds;
  const match = raw.trim().match(/^(\d+)([smhd]?)$/);
  if (!match) return fallbackSeconds;
  const value = Number(match[1]);
  const unit = match[2] || 's';
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit as 's' | 'm' | 'h' | 'd'];
  return value * factor;
}

export const ACCESS_TOKEN_TTL_SECONDS = parseDurationSeconds(process.env.JWT_EXPIRES_IN, 15 * 60);
export const REFRESH_TOKEN_TTL_SECONDS = parseDurationSeconds(
  process.env.JWT_REFRESH_EXPIRES_IN,
  7 * 86400
);
