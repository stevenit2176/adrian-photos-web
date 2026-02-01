/**
 * Authentication utilities
 * JWT token generation, password hashing, and verification
 */

import { Env, JWTPayload } from './types';

/**
 * Hash a password using Web Crypto API with salt
 * Format: salt:hash (both in hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Hash password with salt using SHA-256
  const combined = new Uint8Array([...salt, ...data]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt:hash format
  return `${saltHex}:${hashHex}`;
}

/**
 * Compare a password with a hash
 * Hash format: salt:hash (both in hex)
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Split stored hash into salt and hash
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      return false;
    }
    
    const [saltHex, expectedHashHex] = parts;
    
    // Convert salt from hex to Uint8Array
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Hash the provided password with the same salt
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const combined = new Uint8Array([...salt, ...passwordData]);
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare the computed hash with the stored hash
    return computedHashHex === expectedHashHex;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

/**
 * Generate a JWT access token
 */
export async function generateAccessToken(
  userId: string,
  email: string,
  role: string,
  secret: string,
  expiresIn: string = '15m'
): Promise<string> {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpiry(expiresIn),
  };

  return await signJWT(payload, secret);
}

/**
 * Generate a refresh token (longer expiry)
 */
export async function generateRefreshToken(
  userId: string,
  email: string,
  role: string,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseExpiry(expiresIn),
  };

  return await signJWT(payload, secret);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  try {
    const payload = await verifyJWT(token, secret);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Parse expiry string to seconds
 */
function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900; // Default 15 minutes
  }
}

/**
 * Sign a JWT using Web Crypto API
 */
async function signJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureB64 = base64UrlEncode(signature);

  return `${data}.${signatureB64}`;
}

/**
 * Verify and decode a JWT
 */
async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const encoder = new TextEncoder();
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = base64UrlDecode(signatureB64);
  const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(base64UrlDecodeString(payloadB64));
  return payload as JWTPayload;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  let binary: string;
  
  if (typeof data === 'string') {
    binary = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    binary = btoa(String.fromCharCode(...bytes));
  }
  
  return binary
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode to ArrayBuffer
 */
function base64UrlDecode(data: string): ArrayBuffer {
  const binary = data
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padding = '='.repeat((4 - (binary.length % 4)) % 4);
  const decoded = atob(binary + padding);
  
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Base64 URL decode to string
 */
function base64UrlDecodeString(data: string): string {
  const binary = data
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padding = '='.repeat((4 - (binary.length % 4)) % 4);
  return atob(binary + padding);
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: Request, env: Env): Promise<JWTPayload> {
  const token = extractToken(request);
  if (!token) {
    throw new Error('No token provided');
  }
  
  return await verifyToken(token, env.JWT_SECRET);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: JWTPayload): boolean {
  return user.role === 'admin';
}
