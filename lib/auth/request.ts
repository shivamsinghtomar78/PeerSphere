import type { NextRequest } from 'next/server';
import type { TokenPayload } from '@/lib/auth/jwt';

/**
 * Request-scoped auth identity, as forwarded by the proxy (proxy.ts) on the
 * x-user-id / x-user-role headers. The proxy strips any client-supplied
 * values and only sets these from a verified JWT, so handlers may trust them.
 */
export type AuthPayload = TokenPayload;

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
