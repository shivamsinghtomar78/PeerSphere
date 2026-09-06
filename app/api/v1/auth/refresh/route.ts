import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  internalError,
  rateLimitedError,
} from '@/lib/api/response';
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/auth/rate-limit';
import { signToken, verifyToken, TokenPayload } from '@/lib/auth/jwt';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/lib/auth/env';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /auth/refresh
export async function POST(request: NextRequest) {
  try {
    // Higher threshold than login — legitimate clients refresh periodically
    if (!checkRateLimit(`refresh:${clientKeyFromHeaders(request.headers)}`, 30, 60_000)) {
      return rateLimitedError('Too many refresh attempts, try again in a minute');
    }

    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    // Verify refresh token (refresh secret — an access token must not pass here)
    const payload = await verifyToken(refreshToken, JWT_REFRESH_SECRET);
    if (!payload) {
      return unauthorizedError('Refresh token invalid or expired');
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return unauthorizedError('User not found');
    }

    // Generate new tokens
    const newPayload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = await signToken(newPayload, JWT_SECRET, ACCESS_TOKEN_TTL_SECONDS);
    const newRefreshToken = await signToken(
      newPayload,
      JWT_REFRESH_SECRET,
      REFRESH_TOKEN_TTL_SECONDS
    );

    return successResponse({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[AUTH_REFRESH_ERROR]', error);
    return internalError('Token refresh failed');
  }
}
