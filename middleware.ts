import { NextResponse, NextRequest } from 'next/server';

export type AuthPayload = {
  userId: string;
  role: 'STUDENT' | 'PLACEMENT_ADMIN';
};

export type AuthRequest = NextRequest & {
  user?: AuthPayload;
};

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Public routes that don't require authentication.
// Convention: entries WITHOUT a trailing slash match only the exact path;
// entries WITH a trailing slash match the path and everything under it.
// The jobs list is public, but /api/v1/jobs/<anything> must stay protected
// (detail, applications, evaluations, publish, close, apply).
const PUBLIC_ROUTES = [
  '/api/v1/auth',
  '/api/v1/auth/',
  '/api/v1/jobs',
];

// Routes that are completely public (no auth needed)
const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route);
    }
    return pathname === route;
  });
};

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

// Middleware to check role
export const requireRole = (requiredRoles: ('STUDENT' | 'PLACEMENT_ADMIN')[]) => {
  return (request: NextRequest): Promise<boolean> => {
    return authenticate(request).then((user) => {
      if (!user) {
        return false;
      }
      return requiredRoles.includes(user.role);
    });
  };
};

// Main middleware function
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip authentication for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
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
  
  // Attach user to request headers (for API routes to access)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-role', user.role);
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  return response;
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
