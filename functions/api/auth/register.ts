/**
 * POST /api/auth/register
 * Register a new user account
 */

import { Env } from '../../lib/types';
import { parseJsonBody, successResponse, errorResponse, generateId } from '../../lib/utils';
import { isValidEmail, getPasswordError } from '../../lib/validation';
import { hashPassword, generateAccessToken, generateRefreshToken } from '../../lib/auth';
import { getUserByEmail, createUser, createRefreshToken } from '../../lib/db';
import { ValidationError } from '../../lib/middleware';

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body = await parseJsonBody<RegisterRequest>(request);

    // Validate required fields
    if (!body.email || !body.password) {
      throw new ValidationError('Email and password are required');
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength
    const passwordError = getPasswordError(body.password);
    if (passwordError) {
      throw new ValidationError(passwordError);
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(env.DB, body.email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const userId = generateId();
    const user = await createUser(env.DB, {
      id: userId,
      email: body.email.toLowerCase(),
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: 'customer',
    });

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
    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, 'VALIDATION_ERROR');
    }
    console.error('Register error:', error);
    return errorResponse('Registration failed', 500, 'SERVER_ERROR');
  }
}
