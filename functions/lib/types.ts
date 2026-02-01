/**
 * Shared TypeScript types for Cloudflare Functions
 */

// Environment bindings
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  BAYPHOTO_API_KEY: string;
  ENVIRONMENT: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

// Photo types
export interface Photo {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  r2Key: string;
  thumbnailR2Key: string | null;
  width: number | null;
  height: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface ProductType {
  id: string;
  name: string;
  description: string | null;
  bayPhotoProductCode: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSize {
  id: string;
  productTypeId: string;
  sizeName: string;
  widthInches: number | null;
  heightInches: number | null;
  basePrice: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Order types
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';

export interface Order {
  id: string;
  userId: string | null;
  email: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeSessionId: string | null;
  bayPhotoOrderId: string | null;
  shippingName: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  photoId: string;
  productTypeId: string;
  productSizeId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Request context
export interface RequestContext {
  request: Request;
  env: Env;
  params?: Record<string, string>;
  user?: JWTPayload;
}
