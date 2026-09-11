/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string) {
    return new ApiError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }

  static unprocessable(message: string, details?: unknown) {
    return new ApiError(422, 'UNPROCESSABLE', message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

/**
 * Type guard for catch blocks: lets route handlers distinguish an expected
 * ApiError (map statusCode → response) from an unexpected crash without
 * `catch (error: any)`. instanceof plus a structural fallback, so errors
 * still match across module duplication (e.g. two copies of this file in
 * a bundled route vs. a service chunk).
 */
export function isApiError(error: unknown): error is ApiError {
  if (error instanceof ApiError) return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'ApiError' &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}
