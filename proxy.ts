import { NextResponse, NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getJwtSecret } from '@/lib/auth/env';
import type { AuthPayload } from '@/lib/auth/request';

// Next 16 renamed the `middleware` file convention to `proxy` — same runtime,
// same matcher semantics (this file replaces the deprecated middleware.ts).
// Route handlers read the verified identity via getAuthUser (lib/auth/request).

// Public (route, method) pairs. Everything else under /api/v1/* requires a
// valid token regardless of HTTP method. Paths match exactly — sub-routes of
// a public path (e.g. /api/v1/jobs/[jobId]) are NOT public.
const PUBLIC_ROUTES: ReadonlyArray<{ path: string; method: string }> = [
  { path: '/api/v1/auth', method: 'POST' },
  { path: '/api/v1/auth/refresh', method: 'POST' },
  { path: '/api/v1/jobs', method: 'GET' },
];

const isPublicRoute = (pathname: string, method: string): boolean =>
  PUBLIC_ROUTES.some((r) => r.path === pathname && r.method === method);

// Extract token from Authorization header
const extractToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};

// Authenticate a request from its Authorization header
export const authenticate = (request: NextRequest): Promise<AuthPayload | null> => {
  const token = extractToken(request);
  if (!token) {
    return Promise.resolve(null);
  }
  return verifyToken(token, getJwtSecret());
};

// Main proxy function
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // SECURITY: x-user-id / x-user-role are trusted by API handlers (getAuthUser).
  // They must only ever be set by this proxy from a verified token, so
  // strip any client-supplied values on EVERY request — public routes included.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');

  // Public (path, method) pairs never 401 — but a valid token still gets its
  // verified identity forwarded (e.g. admins see drafts in the jobs list).
  if (isPublicRoute(pathname, request.method)) {
    const optionalUser = await authenticate(request);
    if (optionalUser) {
      requestHeaders.set('x-user-id', optionalUser.userId);
      requestHeaders.set('x-user-role', optionalUser.role);
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Authenticate the request
  const user = await authenticate(request);

  if (!user) {
    // No valid token - return 401
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Attach the verified identity onto the sanitized headers
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-role', user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configuration for the Next.js proxy
export const config = {
  matcher: '/api/v1/:path*',
};
