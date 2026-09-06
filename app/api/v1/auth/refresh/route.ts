import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  internalError,
} from '@/lib/api/response';
import { JWT_SECRET, JWT_REFRESH_SECRET, signAccess, signRefresh } from '../route';

// Validation schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /auth/refresh
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    // Verify refresh token
    let payload: { userId: string; role: string };
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        userId: string;
        role: string;
      };
    } catch {
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
    const newPayload = { userId: user.id, role: user.role };
    const accessToken = signAccess(newPayload);
    const newRefreshToken = signRefresh(newPayload);

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
