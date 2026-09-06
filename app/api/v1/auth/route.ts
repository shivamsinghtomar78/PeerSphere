import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  internalError,
} from '@/lib/api/response';
import { signToken, TokenPayload } from '@/lib/auth/jwt';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/lib/auth/env';

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function signAccess(payload: TokenPayload): Promise<string> {
  return signToken(payload, JWT_SECRET, ACCESS_TOKEN_TTL_SECONDS);
}

function signRefresh(payload: TokenPayload): Promise<string> {
  return signToken(payload, JWT_REFRESH_SECRET, REFRESH_TOKEN_TTL_SECONDS);
}

// GET handler
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        message: 'Auth API v1',
        endpoints: ['POST /auth/login', 'POST /auth/refresh'],
      },
    },
    { status: 200 }
  );
}

// POST /auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return unauthorizedError('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      return unauthorizedError('Account is not active');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return unauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const payload: TokenPayload = { userId: user.id, role: user.role };
    const accessToken = await signAccess(payload);
    const refreshToken = await signRefresh(payload);

    return successResponse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestError('Validation failed', error.flatten().fieldErrors);
    }
    console.error('[AUTH_LOGIN_ERROR]', error);
    return internalError('Login failed');
  }
}
