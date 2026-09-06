/**
 * Integration: POST /api/v1/auth (login) + POST /api/v1/auth/refresh
 * against the seeded test database (.env.test).
 */
import { NextRequest } from 'next/server';
import { POST as login } from '@/app/api/v1/auth/route';
import { POST as refresh } from '@/app/api/v1/auth/refresh/route';
import { verifyToken } from '@/lib/auth/jwt';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '@/lib/auth/env';
import { prisma } from '@/lib/db/prisma';
import { resetRateLimits } from '@/lib/auth/rate-limit';

const STUDENT_EMAIL = 'arjun.sharma@college.edu';

function postJson(path: string, body: unknown, ip = '10.9.9.9'): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => resetRateLimits());
afterAll(() => prisma.$disconnect());

describe('POST /api/v1/auth — login', () => {
  it('valid student login → 200 with verifiable tokens and user shape', async () => {
    const res = await login(postJson('/api/v1/auth', { email: STUDENT_EMAIL, password: 'student123' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user).toMatchObject({ email: STUDENT_EMAIL, role: 'STUDENT' });

    const access = await verifyToken(json.data.accessToken, JWT_SECRET);
    expect(access).toMatchObject({ userId: json.data.user.id, role: 'STUDENT' });
    // access token must NOT verify against the refresh secret and vice versa
    expect(await verifyToken(json.data.accessToken, JWT_REFRESH_SECRET)).toBeNull();
    expect(await verifyToken(json.data.refreshToken, JWT_SECRET)).toBeNull();
  });

  it('valid admin login → 200 with PLACEMENT_ADMIN role', async () => {
    const res = await login(postJson('/api/v1/auth', { email: 'placement@college.edu', password: 'admin123' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.user.role).toBe('PLACEMENT_ADMIN');
  });

  it('wrong password → 401 with the same error shape as unknown email (no user enumeration)', async () => {
    const wrongPw = await login(postJson('/api/v1/auth', { email: STUDENT_EMAIL, password: 'wrongpass' }));
    const unknown = await login(postJson('/api/v1/auth', { email: 'ghost@college.edu', password: 'whatever1' }));
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    const [a, b] = [await wrongPw.json(), await unknown.json()];
    expect(a.error.message).toBe(b.error.message); // identical message
    expect(a.error.code).toBe(b.error.code);
  });

  it('failed login writes an AUTH_LOGIN_FAILED audit event without the password', async () => {
    const before = await prisma.auditEvent.count({ where: { action: 'AUTH_LOGIN_FAILED' } });
    await login(postJson('/api/v1/auth', { email: STUDENT_EMAIL, password: 'not-the-password' }));
    const events = await prisma.auditEvent.findMany({
      where: { action: 'AUTH_LOGIN_FAILED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(events.length).toBe(before + 1);
    expect(JSON.stringify(events[0])).not.toContain('not-the-password');
  });

  it('malformed body → 400 with field errors', async () => {
    const res = await login(postJson('/api/v1/auth', { email: 'not-an-email', password: '1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.details).toHaveProperty('email');
  });

  it('rate limits after 10 attempts from one client → 429', async () => {
    for (let i = 0; i < 10; i++) {
      await login(postJson('/api/v1/auth', { email: 'x@y.com', password: 'zzzzzzz' }, '10.1.1.1'));
    }
    const res = await login(postJson('/api/v1/auth', { email: 'x@y.com', password: 'zzzzzzz' }, '10.1.1.1'));
    expect(res.status).toBe(429);
    // a different client is unaffected
    const other = await login(postJson('/api/v1/auth', { email: STUDENT_EMAIL, password: 'student123' }, '10.2.2.2'));
    expect(other.status).toBe(200);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  async function loginTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await login(postJson('/api/v1/auth', { email: STUDENT_EMAIL, password: 'student123' }));
    return (await res.json()).data;
  }

  it('refresh token → new verifiable access + refresh tokens', async () => {
    const { refreshToken } = await loginTokens();
    const res = await refresh(postJson('/api/v1/auth/refresh', { refreshToken }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(await verifyToken(json.data.accessToken, JWT_SECRET)).not.toBeNull();
    expect(await verifyToken(json.data.refreshToken, JWT_REFRESH_SECRET)).not.toBeNull();
  });

  it('an ACCESS token presented as refresh token → 401', async () => {
    const { accessToken } = await loginTokens();
    const res = await refresh(postJson('/api/v1/auth/refresh', { refreshToken: accessToken }));
    expect(res.status).toBe(401);
  });

  it('garbage refresh token → 401; missing field → 400', async () => {
    expect((await refresh(postJson('/api/v1/auth/refresh', { refreshToken: 'garbage' }))).status).toBe(401);
    expect((await refresh(postJson('/api/v1/auth/refresh', {}))).status).toBe(400);
  });
});
