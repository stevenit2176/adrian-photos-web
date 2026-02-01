/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */

import { Env } from '../../lib/types';
import { parseJsonBody, successResponse, errorResponse, generateId } from '../../lib/utils';
import { isValidEmail } from '../../lib/validation';
import { comparePassword, generateAccessToken, generateRefreshToken } from '../../lib/auth';
import { getUserByEmail, createRefreshToken } from '../../lib/db';
import { ValidationError } from '../../lib/middleware';

interface LoginRequest {
  email: string;
  password: string;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body = await parseJsonBody<LoginRequest>(request);

    // Validate required fields
    if (!body.email || !body.password) {
      throw new ValidationError('Email and password are required');
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Get user by email (includes password hash)
    const user = await getUserByEmail(env.DB, body.email.toLowerCase());
    if (!user) {
      return errorResponse('Invalid credentials', 401, 'AUTH_INVALID');
    }

    // Verify password
    const isValidPassword = await comparePassword(body.password, user.passwordHash);
    if (!isValidPassword) {
      return errorResponse('Invalid credentials', 401, 'AUTH_INVALID');
    }

    // Generate tokens
    const accessToken = await generateAccessToken(
      user.id,
      user.email,
      user.role,
      env.JWT_SECRET,
      env.JWT_ACCESS_EXPIRY
    );

    const refreshToken = await generateRefreshToken(
      user.id,
      user.email,
      user.role,
      env.JWT_SECRET,
      env.JWT_REFRESH_EXPIRY
    );

    // Store refresh token in database
    const refreshTokenId = generateId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await createRefreshToken(env.DB, {
      id: refreshTokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: expiresAt.toISOString(),
    });

    // Return user data (without password) and tokens
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, 'VALIDATION_ERROR');
    }
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return errorResponse(`Login failed: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
