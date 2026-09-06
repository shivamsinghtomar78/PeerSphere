import { checkRateLimit, resetRateLimits, clientKeyFromHeaders } from '@/lib/auth/rate-limit';

describe('lib/auth/rate-limit — sliding window', () => {
  beforeEach(() => {
    resetRateLimits();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows up to max requests, blocks the next', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('k1', 10, 60_000)).toBe(true);
    }
    expect(checkRateLimit('k1', 10, 60_000)).toBe(false);
  });

  it('allows again after the window expires', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('k1', 10, 60_000);
    expect(checkRateLimit('k1', 10, 60_000)).toBe(false);

    jest.advanceTimersByTime(61_000);
    expect(checkRateLimit('k1', 10, 60_000)).toBe(true);
  });

  it('slides — old requests age out individually', () => {
    // 5 requests at t=0, 5 at t=30s → full at t=30s
    for (let i = 0; i < 5; i++) checkRateLimit('k1', 10, 60_000);
    jest.advanceTimersByTime(30_000);
    for (let i = 0; i < 5; i++) checkRateLimit('k1', 10, 60_000);
    expect(checkRateLimit('k1', 10, 60_000)).toBe(false);

    // at t=61s the first 5 aged out → 5 slots free
    jest.advanceTimersByTime(31_000);
    expect(checkRateLimit('k1', 10, 60_000)).toBe(true);
  });

  it('isolates keys', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('k1', 10, 60_000);
    expect(checkRateLimit('k1', 10, 60_000)).toBe(false);
    expect(checkRateLimit('k2', 10, 60_000)).toBe(true);
  });

  it('derives client keys from proxy headers', () => {
    expect(clientKeyFromHeaders(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
    expect(clientKeyFromHeaders(new Headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8');
    expect(clientKeyFromHeaders(new Headers())).toBe('unknown');
  });
});
