/**
 * Utility functions following DRY and clean code principles
 */

import { ApiResponse, ApiError } from './types';

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T, status = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status = 500,
  code = 'SERVER_ERROR',
  details?: any
): Response {
  const error: ApiError = {
    message,
    code,
    ...(details && { details }),
  };

  const response: ApiResponse = {
    success: false,
    error,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseJsonBody<T = any>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Format price from cents to dollars
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * Convert snake_case database fields to camelCase
 */
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  
  return obj;
}

/**
 * Convert camelCase to snake_case for database
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  
  return obj;
}

/**
 * Sleep for specified milliseconds (useful for testing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate required fields in an object
 */
export function validateRequired(obj: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!obj[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Create a slug from a string
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Calculate tax (simple implementation for MVP)
 * @param subtotal - Amount in cents
 * @param state - US state code
 * @returns Tax amount in cents
 */
export function calculateTax(subtotal: number, state: string): number {
  // Simple tax calculation - 8% for CA, 0% for others
  // In production, use a proper tax service
  const taxRate = state === 'CA' ? 0.08 : 0.0;
  return Math.round(subtotal * taxRate);
}

/**
 * Calculate shipping (flat rate for MVP)
 * @param itemCount - Number of items
 * @returns Shipping cost in cents
 */
export function calculateShipping(itemCount: number): number {
  // Flat rate for MVP - $15 per order
  return itemCount > 0 ? 1500 : 0;
}

/**
 * Paginate results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 20
): {
  items: T[];
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
} {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);

  return {
    items: paginatedItems,
    total,
    page,
    pages,
    hasMore: page < pages,
  };
}

/**
 * Extract query parameters from URL
 */
export function getQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

/**
 * Get integer query parameter with default
 */
export function getIntParam(params: URLSearchParams, key: string, defaultValue: number): number {
  const value = params.get(key);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get boolean query parameter with default
 */
export function getBoolParam(params: URLSearchParams, key: string, defaultValue: boolean): boolean {
  const value = params.get(key);
  if (value === null) return defaultValue;
  return value === 'true' || value === '1';
}
