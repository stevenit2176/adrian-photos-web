/**
 * User and authentication models
 */

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}
