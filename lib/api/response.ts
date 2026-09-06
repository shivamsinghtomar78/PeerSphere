// Standard API response formats
import { NextResponse } from 'next/server';

export interface ApiError {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  requestId?: string;
}

// Generate a request ID for tracing
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

// Success response
export const successResponse = <T>(
  data: T,
  requestId?: string,
  status?: number
): NextResponse => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    requestId: requestId || generateRequestId(),
  };
  return NextResponse.json(response, status ? { status } : undefined);
};

// Error response
export const errorResponse = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
  requestId?: string
): NextResponse => {
  const response: ApiError = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId: requestId || generateRequestId(),
  };
  return NextResponse.json(response, { status });
};

// Validation error
export const validationError = (message: string, details?: unknown): NextResponse => {
  return errorResponse(400, 'VALIDATION_ERROR', message, details);
};

// Unauthorized error
export const unauthorizedError = (message: string = 'Authentication required'): NextResponse => {
  return errorResponse(401, 'UNAUTHORIZED', message);
};

// Forbidden error
export const forbiddenError = (message: string = 'Insufficient permissions'): NextResponse => {
  return errorResponse(403, 'FORBIDDEN', message);
};

// Not found error
export const notFoundError = (resource: string): NextResponse => {
  return errorResponse(404, 'NOT_FOUND', `${resource} not found`);
};

// Conflict error
export const conflictError = (message: string): NextResponse => {
  return errorResponse(409, 'CONFLICT', message);
};

// Internal server error
export const internalError = (message: string = 'Internal server error'): NextResponse => {
  return errorResponse(500, 'INTERNAL_ERROR', message);
};

// Bad request error
export const badRequestError = (message: string, details?: unknown): NextResponse => {
  return errorResponse(400, 'BAD_REQUEST', message, details);
};

// Unprocessable entity error
export const unprocessableError = (message: string, details?: unknown): NextResponse => {
  return errorResponse(422, 'UNPROCESSABLE', message, details);
};
