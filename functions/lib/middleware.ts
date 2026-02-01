/**
 * Middleware functions for authentication and request handling
 */

import { Env, JWTPayload, RequestContext } from './types';
import { getAuthUser, isAdmin } from './auth';
import { errorResponse } from './utils';

/**
 * Require authentication middleware
 * Extracts and verifies JWT token, attaches user to context
 */
export async function requireAuth(request: Request, env: Env): Promise<JWTPayload> {
  try {
    const user = await getAuthUser(request, env);
    return user;
  } catch (error) {
    throw new AuthError('Authentication required');
  }
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request: Request, env: Env): Promise<JWTPayload> {
  const user = await requireAuth(request, env);
  
  if (!isAdmin(user)) {
    throw new ForbiddenError('Admin access required');
  }
  
  return user;
}

/**
 * Optional authentication - doesn't throw if no token
 */
export async function optionalAuth(request: Request, env: Env): Promise<JWTPayload | null> {
  try {
    const user = await getAuthUser(request, env);
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * CORS middleware
 */
export function corsHeaders(origin: string = '*'): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight
 */
export function handleCorsPreflightRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const cors = corsHeaders();
  
  Object.entries(cors).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Wrap handler with error handling
 */
export function withErrorHandling(
  handler: (context: RequestContext) => Promise<Response>
): (context: any) => Promise<Response> {
  return async (context: any) => {
    try {
      const response = await handler(context);
      return addCorsHeaders(response);
    } catch (error) {
      console.error('Handler error:', error);
      return addCorsHeaders(handleError(error));
    }
  };
}

/**
 * Handle different error types
 */
function handleError(error: any): Response {
  if (error instanceof AuthError) {
    return errorResponse(error.message, 401, 'AUTH_REQUIRED');
  }
  
  if (error instanceof ForbiddenError) {
    return errorResponse(error.message, 403, 'FORBIDDEN');
  }
  
  if (error instanceof NotFoundError) {
    return errorResponse(error.message, 404, 'NOT_FOUND');
  }
  
  if (error instanceof ValidationError) {
    return errorResponse(error.message, 400, 'VALIDATION_ERROR', error.details);
  }
  
  if (error instanceof ConflictError) {
    return errorResponse(error.message, 409, 'CONFLICT');
  }
  
  // Generic server error
  return errorResponse(
    'An unexpected error occurred',
    500,
    'SERVER_ERROR'
  );
}

/**
 * Custom error classes
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  details?: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limiting helper (simple in-memory for MVP)
 * In production, use Durable Objects or KV
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Validate request content type
 */
export function requireJsonContent(request: Request): void {
  const contentType = request.headers.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }
}
