import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../errors/ApiError';
import { AuthPayload } from '../../types';

const SALT_ROUNDS = 12;

function signAccess(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw ApiError.internal('JWT_SECRET not configured');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions);
}

function signRefresh(payload: AuthPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw ApiError.internal('JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status !== 'ACTIVE') throw ApiError.forbidden('Account is not active');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  const payload: AuthPayload = { userId: user.id, role: user.role };
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function refresh(token: string) {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw ApiError.internal('JWT_REFRESH_SECRET not configured');

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, secret) as AuthPayload;
  } catch {
    throw ApiError.unauthorized('Refresh token invalid or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== 'ACTIVE') throw ApiError.unauthorized('User not found');

  const newPayload: AuthPayload = { userId: user.id, role: user.role };
  return {
    accessToken: signAccess(newPayload),
    refreshToken: signRefresh(newPayload),
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
