import { NextResponse, NextRequest } from 'next/server';

export type AuthPayload = {
  userId: string;
  role: 'STUDENT' | 'PLACEMENT_ADMIN';
};

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Verify JWT token using Web Crypto (HMAC-SHA256) — works in both Edge and Node runtimes
const verifyToken = async (token: string, secret: string): Promise<AuthPayload | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;

    // Reject tokens not signed with HS256
    let parsedHeader: { alg?: string } = {};
    try {
      parsedHeader = JSON.parse(atob(header.replace(/-/g, '+').replace(/_/g, '/')) as string);
    } catch {
      return null;
    }
    if (parsedHeader.alg !== 'HS256') return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const dataBytes = encoder.encode(data);

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
    if (!valid) return null;

    const payloadJson = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')) as string) as {
      userId?: string;
      role?: 'STUDENT' | 'PLACEMENT_ADMIN';
      exp?: number;
    };

    if (!payloadJson.userId || !payloadJson.role) return null;
    if (payloadJson.exp && payloadJson.exp * 1000 < Date.now()) return null;

    return { userId: payloadJson.userId, role: payloadJson.role };
  } catch {
    return null;
  }
};

// Middleware to authenticate requests
export const authenticate = (request: NextRequest): Promise<AuthPayload | null> => {
  const token = extractToken(request);
  if (!token) {
    return Promise.resolve(null);
  }
  return verifyToken(token, JWT_SECRET);
};

// Main middleware function
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // SECURITY: x-user-id / x-user-role are trusted by API handlers (getAuthUser).
  // They must only ever be set by this middleware from a verified token, so
  // strip any client-supplied values on EVERY request — public routes included.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');

  // Public (path, method) pairs pass through with sanitized headers, no auth
  if (isPublicRoute(pathname, request.method)) {
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

// Export for use in API routes
export const getAuthUser = (request: NextRequest): AuthPayload | null => {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!userId || !userRole) {
    return null;
  }

  // Validate role
  const validRoles: ('STUDENT' | 'PLACEMENT_ADMIN')[] = ['STUDENT', 'PLACEMENT_ADMIN'];
  if (!validRoles.includes(userRole as 'STUDENT' | 'PLACEMENT_ADMIN')) {
    return null;
  }

  return {
    userId,
    role: userRole as 'STUDENT' | 'PLACEMENT_ADMIN',
  };
};

// Configuration for Next.js middleware
export const config = {
  matcher: '/api/v1/:path*',
};
