/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance deploys; swap the Map for Redis (same
 * interface) when running multiple instances.
 */

type WindowState = number[]; // timestamps (ms) of accepted requests

const windows = new Map<string, WindowState>();

// Prune dead entries occasionally so the map doesn't grow unbounded.
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 5 * 60_000;

function prune(windowMs: number): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, timestamps] of windows) {
    const alive = timestamps.filter((t) => now - t < windowMs);
    if (alive.length === 0) windows.delete(key);
    else windows.set(key, alive);
  }
}

/**
 * Returns true when the request is allowed, false when the key has exhausted
 * its budget for the current window.
 */
export function checkRateLimit(key: string, max = 10, windowMs = 60_000): boolean {
  prune(windowMs);
  const now = Date.now();
  const timestamps = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= max) {
    windows.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  windows.set(key, timestamps);
  return true;
}

/** Test hook — clears all rate-limit state. */
export function resetRateLimits(): void {
  windows.clear();
}

/** Derives a client key from proxy headers; falls back to a shared bucket. */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
