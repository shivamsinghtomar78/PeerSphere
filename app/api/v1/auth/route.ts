import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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
import { signToken, TokenPayload } from '@/lib/auth/jwt';
import {
  getJwtSecret,
  getJwtRefreshSecret,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/lib/auth/env';

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Failed logins are audited (never the password). Best-effort: an audit
// failure must not mask the 401.
async function logFailedLogin(userId: string | null, email: string): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: userId,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'user',
        resourceId: userId ?? email.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('[AUTH_AUDIT_ERROR]', error);
  }
}

function signAccess(payload: TokenPayload): Promise<string> {
  return signToken(payload, getJwtSecret(), ACCESS_TOKEN_TTL_SECONDS);
}

function signRefresh(payload: TokenPayload): Promise<string> {
  return signToken(payload, getJwtRefreshSecret(), REFRESH_TOKEN_TTL_SECONDS);
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
    // Throttle credential stuffing: 10 attempts/min per client
    if (!checkRateLimit(`login:${clientKeyFromHeaders(request.headers)}`, 10, 60_000)) {
      return rateLimitedError('Too many login attempts, try again in a minute');
    }

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await logFailedLogin(null, email);
      return unauthorizedError('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      await logFailedLogin(user.id, email);
      return unauthorizedError('Account is not active');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logFailedLogin(user.id, email);
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
