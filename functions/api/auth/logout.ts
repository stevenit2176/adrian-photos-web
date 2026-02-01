/**
 * POST /api/auth/logout
 * Logout user by invalidating refresh token
 */

import { Env } from '../../lib/types';
import { parseJsonBody, successResponse, errorResponse } from '../../lib/utils';
import { deleteRefreshToken } from '../../lib/db';
import { ValidationError } from '../../lib/middleware';

interface LogoutRequest {
  refreshToken: string;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body = await parseJsonBody<LogoutRequest>(request);

    if (!body.refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Delete refresh token from database
    // This will invalidate it, even if it's still valid
    await deleteRefreshToken(env.DB, body.refreshToken);

    return successResponse({
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, 'VALIDATION_ERROR');
    }
    console.error('Logout error:', error);
    // Even if logout fails, we can return success
    // The client should clear their tokens anyway
    return successResponse({
      message: 'Logged out successfully',
    });
  }
}
