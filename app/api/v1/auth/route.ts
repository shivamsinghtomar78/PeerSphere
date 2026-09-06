import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  badRequestError,
  unauthorizedError,
  internalError,
} from '@/lib/api/response';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// JWT configuration
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccess(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function signRefresh(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
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
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

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

// Handle refresh token - separate route file
export { refreshSchema, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, signAccess, signRefresh };
