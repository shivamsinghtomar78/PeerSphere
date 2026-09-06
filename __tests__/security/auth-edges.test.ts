/**
 * Negative-path auth edges beyond the middleware regression suite:
 * role enforcement at the handler level and malformed credentials.
 */
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { GET as listStudents } from '@/app/api/v1/students/route';

function makeRequest(
  path: string,
  method: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method, headers });
}

describe('handler-level role enforcement', () => {
  it('STUDENT identity on admin roster route → 403', async () => {
    // Simulates the headers middleware forwards for a verified STUDENT token
    const res = await listStudents(
      makeRequest('/api/v1/students', 'GET', {
        'x-user-id': 'student-1',
        'x-user-role': 'STUDENT',
      })
    );
    expect(res.status).toBe(403);
  });

  it('no identity headers on admin roster route → 401', async () => {
    const res = await listStudents(makeRequest('/api/v1/students', 'GET'));
    expect(res.status).toBe(401);
  });

  it('garbage role header → 401 (getAuthUser rejects unknown roles)', async () => {
    const res = await listStudents(
      makeRequest('/api/v1/students', 'GET', {
        'x-user-id': 'u1',
        'x-user-role': 'SUPERUSER',
      })
    );
    expect(res.status).toBe(401);
  });
});

describe('malformed credentials at the middleware', () => {
  it.each([
    ['Basic scheme', 'Basic dXNlcjpwYXNz'],
    ['bare token without Bearer', 'some.jwt.token'],
    ['empty Bearer', 'Bearer '],
    ['Bearer with garbage', 'Bearer not-a-jwt-at-all'],
  ])('%s → 401', async (_label, authorization) => {
    const res = await middleware(
      makeRequest('/api/v1/students/me', 'GET', { authorization })
    );
    expect(res.status).toBe(401);
  });
});
