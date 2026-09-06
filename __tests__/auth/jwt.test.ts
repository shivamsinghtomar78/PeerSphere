import { signToken, verifyToken } from '@/lib/auth/jwt';

const SECRET = 'unit-test-secret-0123456789abcdef0123456789abcdef';

describe('lib/auth/jwt — the single JWT implementation', () => {
  it('sign → verify round-trips the payload', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT' }, SECRET, 3600);
    const payload = await verifyToken(token, SECRET);
    expect(payload).toEqual({ userId: 'u1', role: 'STUDENT' });
  });

  it('rejects a tampered signature', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT' }, SECRET, 3600);
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(await verifyToken(tampered, SECRET)).toBeNull();
  });

  it('rejects a tampered payload (role escalation attempt)', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT' }, SECRET, 3600);
    const [header, , signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ userId: 'u1', role: 'PLACEMENT_ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 })
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(await verifyToken(`${header}.${forgedBody}.${signature}`, SECRET)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT' }, SECRET, -60);
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it('rejects the wrong secret (access token against refresh secret)', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT' }, SECRET, 3600);
    expect(await verifyToken(token, 'a-different-secret-0123456789abcdef012345')).toBeNull();
  });

  it('rejects non-HS256 alg headers', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT' }, SECRET, 3600);
    const [, body, signature] = token.split('.');
    const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      .toString('base64')
      .replace(/=+$/, '');
    expect(await verifyToken(`${noneHeader}.${body}.${signature}`, SECRET)).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyToken('not-a-jwt', SECRET)).toBeNull();
    expect(await verifyToken('a.b', SECRET)).toBeNull();
    expect(await verifyToken('', SECRET)).toBeNull();
  });

  it('rejects payloads with an invalid role value', async () => {
    // sign a token whose role is not in the allowed union
    const token = await signToken(
      { userId: 'u1', role: 'SUPERUSER' as unknown as 'STUDENT' },
      SECRET,
      3600
    );
    expect(await verifyToken(token, SECRET)).toBeNull();
  });
});

describe('lib/auth/env — fail-fast secrets', () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL };
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  it('throws at import when JWT_SECRET is unset', async () => {
    delete process.env.JWT_SECRET;
    await expect(import('@/lib/auth/env')).rejects.toThrow('JWT_SECRET is not set');
  });

  it('throws at import when JWT_SECRET is too short', async () => {
    process.env.JWT_SECRET = 'short';
    await expect(import('@/lib/auth/env')).rejects.toThrow('at least 32 characters');
  });

  it('exports the secrets when set', async () => {
    const env = await import('@/lib/auth/env');
    expect(env.JWT_SECRET).toBe(process.env.JWT_SECRET);
    expect(env.ACCESS_TOKEN_TTL_SECONDS).toBeGreaterThan(0);
  });

  it('parses duration strings', async () => {
    const { parseDurationSeconds } = await import('@/lib/auth/env');
    expect(parseDurationSeconds('15m', 0)).toBe(900);
    expect(parseDurationSeconds('7d', 0)).toBe(604800);
    expect(parseDurationSeconds('3600', 0)).toBe(3600);
    expect(parseDurationSeconds('garbage', 42)).toBe(42);
    expect(parseDurationSeconds(undefined, 42)).toBe(42);
  });
});
