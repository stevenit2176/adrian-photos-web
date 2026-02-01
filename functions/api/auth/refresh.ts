/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { Env } from '../../lib/types';
import { parseJsonBody, successResponse, errorResponse, generateId } from '../../lib/utils';
import { verifyToken, generateAccessToken, generateRefreshToken } from '../../lib/auth';
import { getRefreshToken, deleteRefreshToken, createRefreshToken, getUserById } from '../../lib/db';
import { ValidationError, AuthError } from '../../lib/middleware';

interface RefreshRequest {
  refreshToken: string;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body = await parseJsonBody<RefreshRequest>(request);

    if (!body.refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token signature and expiration
    let payload;
    try {
      payload = await verifyToken(body.refreshToken, env.JWT_SECRET);
    } catch (error) {
      throw new AuthError('Invalid refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await getRefreshToken(env.DB, body.refreshToken);
    if (!storedToken) {
      throw new AuthError('Refresh token not found');
    }

    // Check if token is expired
    const expiresAt = new Date(storedToken.expiresAt);
    if (expiresAt < new Date()) {
      // Delete expired token
      await deleteRefreshToken(env.DB, body.refreshToken);
      throw new AuthError('Refresh token expired');
    }

    // Get user to ensure they still exist
    const user = await getUserById(env.DB, payload.userId);
    if (!user) {
      // Delete token for non-existent user
      await deleteRefreshToken(env.DB, body.refreshToken);
      throw new AuthError('User not found');
    }

    // Delete old refresh token (rotation)
    await deleteRefreshToken(env.DB, body.refreshToken);

    // Generate new tokens
    const newAccessToken = await generateAccessToken(
      user.id,
      user.email,
      user.role,
      env.JWT_SECRET,
      env.JWT_ACCESS_EXPIRY
    );

    const newRefreshToken = await generateRefreshToken(
      user.id,
      user.email,
      user.role,
      env.JWT_SECRET,
      env.JWT_REFRESH_EXPIRY
    );

    // Store new refresh token
    const refreshTokenId = generateId();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days

    await createRefreshToken(env.DB, {
      id: refreshTokenId,
      userId: user.id,
      token: newRefreshToken,
      expiresAt: newExpiresAt.toISOString(),
    });

    return successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, 'VALIDATION_ERROR');
    }
    if (error instanceof AuthError) {
      return errorResponse(error.message, 401, 'AUTH_INVALID');
    }
    console.error('Refresh error:', error);
    return errorResponse('Token refresh failed', 500, 'SERVER_ERROR');
  }
}
