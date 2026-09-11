/**
 * Regression suite for the header-spoofing privilege escalation:
 * unauthenticated requests carrying forged x-user-id / x-user-role headers
 * must never reach a handler with those headers intact.
 */
import { NextRequest } from 'next/server';
import { proxy as middleware } from '@/proxy';

const SECRET = process.env.JWT_SECRET!;

// Minimal HS256 signer (mirrors the token shape produced by the API)
async function signToken(
  payload: Record<string, unknown>,
  secret: string,
  alg = 'HS256'
): Promise<string> {
  const b64url = (s: string) =>
    Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = b64url(JSON.stringify({ alg, typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = Buffer.from(sig)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${data}.${sigB64}`;
}

function makeRequest(
  path: string,
  method: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method, headers });
}

// Headers the middleware forwards to the handler (x-middleware-request-* scheme)
function forwardedHeader(response: Response, name: string): string | null {
  return response.headers.get(`x-middleware-request-${name}`);
}

const futureExp = () => Math.floor(Date.now() / 1000) + 3600;

describe('middleware — header-spoofing privilege escalation (regression)', () => {
  it('rejects unauthenticated POST /api/v1/jobs with forged admin headers → 401', async () => {
    const res = await middleware(
      makeRequest('/api/v1/jobs', 'POST', {
        'x-user-id': 'attacker',
        'x-user-role': 'PLACEMENT_ADMIN',
      })
    );
    expect(res.status).toBe(401);
  });

  it('strips forged x-user-* headers on public GET /api/v1/jobs', async () => {
    const res = await middleware(
      makeRequest('/api/v1/jobs', 'GET', {
        'x-user-id': 'attacker',
        'x-user-role': 'PLACEMENT_ADMIN',
      })
    );
    expect(res.status).toBe(200); // pass-through
    expect(forwardedHeader(res, 'x-user-id')).toBeNull();
    expect(forwardedHeader(res, 'x-user-role')).toBeNull();
  });

  it('forwards VERIFIED identity on public routes (forged headers still stripped)', async () => {
    const token = await signToken(
      { userId: 'admin-1', role: 'PLACEMENT_ADMIN', exp: futureExp() },
      SECRET
    );
    const res = await middleware(
      makeRequest('/api/v1/jobs', 'GET', {
        authorization: `Bearer ${token}`,
        'x-user-id': 'attacker',
        'x-user-role': 'STUDENT',
      })
    );
    expect(res.status).toBe(200);
    expect(forwardedHeader(res, 'x-user-id')).toBe('admin-1');
    expect(forwardedHeader(res, 'x-user-role')).toBe('PLACEMENT_ADMIN');
  });

  it('invalid token on a public route → still public (200), no identity', async () => {
    const res = await middleware(
      makeRequest('/api/v1/jobs', 'GET', { authorization: 'Bearer garbage' })
    );
    expect(res.status).toBe(200);
    expect(forwardedHeader(res, 'x-user-id')).toBeNull();
  });

  it('strips forged headers even when a valid token is presented (verified identity wins)', async () => {
    const token = await signToken(
      { userId: 'real-student', role: 'STUDENT', exp: futureExp() },
      SECRET
    );
    const res = await middleware(
      makeRequest('/api/v1/students/me', 'GET', {
        authorization: `Bearer ${token}`,
        'x-user-id': 'attacker',
        'x-user-role': 'PLACEMENT_ADMIN',
      })
    );
    expect(res.status).toBe(200);
    expect(forwardedHeader(res, 'x-user-id')).toBe('real-student');
    expect(forwardedHeader(res, 'x-user-role')).toBe('STUDENT');
  });
});

describe('middleware — method-aware public routes', () => {
  it.each([
    ['/api/v1/auth', 'POST'],
    ['/api/v1/auth/refresh', 'POST'],
    ['/api/v1/jobs', 'GET'],
  ])('%s %s is public', async (path, method) => {
    const res = await middleware(makeRequest(path as string, method as string));
    expect(res.status).toBe(200);
  });

  it.each([
    ['/api/v1/jobs', 'POST'],
    ['/api/v1/jobs', 'PATCH'],
    ['/api/v1/jobs', 'DELETE'],
    ['/api/v1/jobs/some-id', 'GET'],
    ['/api/v1/jobs/some-id/publish', 'POST'],
    ['/api/v1/auth', 'GET'],
    ['/api/v1/students/me', 'GET'],
    ['/api/v1/applications', 'GET'],
  ])('%s %s requires auth → 401 without token', async (path, method) => {
    const res = await middleware(makeRequest(path as string, method as string));
    expect(res.status).toBe(401);
  });
});

describe('middleware — token verification', () => {
  it('accepts a valid HS256 token and forwards the verified identity', async () => {
    const token = await signToken(
      { userId: 'u1', role: 'PLACEMENT_ADMIN', exp: futureExp() },
      SECRET
    );
    const res = await middleware(
      makeRequest('/api/v1/jobs', 'POST', { authorization: `Bearer ${token}` })
    );
    expect(res.status).toBe(200);
    expect(forwardedHeader(res, 'x-user-id')).toBe('u1');
    expect(forwardedHeader(res, 'x-user-role')).toBe('PLACEMENT_ADMIN');
  });

  it('rejects a tampered signature → 401', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT', exp: futureExp() }, SECRET);
    const tampered = token.slice(0, -4) + 'AAAA';
    const res = await middleware(
      makeRequest('/api/v1/students/me', 'GET', { authorization: `Bearer ${tampered}` })
    );
    expect(res.status).toBe(401);
  });

  it('rejects an expired token → 401', async () => {
    const token = await signToken(
      { userId: 'u1', role: 'STUDENT', exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET
    );
    const res = await middleware(
      makeRequest('/api/v1/students/me', 'GET', { authorization: `Bearer ${token}` })
    );
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with a different secret → 401', async () => {
    const token = await signToken(
      { userId: 'u1', role: 'STUDENT', exp: futureExp() },
      'some-other-secret-entirely-0123456789'
    );
    const res = await middleware(
      makeRequest('/api/v1/students/me', 'GET', { authorization: `Bearer ${token}` })
    );
    expect(res.status).toBe(401);
  });

  it('rejects a non-HS256 alg header (alg confusion) → 401', async () => {
    const token = await signToken({ userId: 'u1', role: 'STUDENT', exp: futureExp() }, SECRET, 'none');
    const res = await middleware(
      makeRequest('/api/v1/students/me', 'GET', { authorization: `Bearer ${token}` })
    );
    expect(res.status).toBe(401);
  });
});
