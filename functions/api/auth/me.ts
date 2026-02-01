/**
 * GET /api/auth/me
 * Get current authenticated user information
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';
import { requireAuth } from '../../lib/middleware';
import { getUserById } from '../../lib/db';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;

    // Require authentication
    const authUser = await requireAuth(request, env);

    // Get full user details from database
    const user = await getUserById(env.DB, authUser.userId);
    if (!user) {
      return errorResponse('User not found', 404, 'NOT_FOUND');
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    if (error.message === 'Authentication required') {
      return errorResponse('Authentication required', 401, 'AUTH_REQUIRED');
    }
    return errorResponse('Failed to get user', 500, 'SERVER_ERROR');
  }
}
