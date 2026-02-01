/**
 * Database utility functions
 * Provides clean, reusable database operations
 */

import { Env, User, UserWithPassword } from './types';
import { toCamelCase } from './utils';

/**
 * Execute a database query and return results in camelCase
 */
export async function query<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const stmt = db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    
    if (!result.results) {
      return [];
    }
    
    return result.results.map(row => toCamelCase(row)) as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database query failed');
  }
}

/**
 * Execute a query and return a single result
 */
export async function queryOne<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await query<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an insert/update/delete query
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<D1Result> {
  try {
    const stmt = db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    return await bound.run();
  } catch (error) {
    console.error('Database execute error:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Execute multiple statements in a batch
 */
export async function executeBatch(
  db: D1Database,
  statements: Array<{ sql: string; params?: any[] }>
): Promise<D1Result[]> {
  try {
    const prepared = statements.map(({ sql, params = [] }) => {
      const stmt = db.prepare(sql);
      return params.length > 0 ? stmt.bind(...params) : stmt;
    });
    
    return await db.batch(prepared);
  } catch (error) {
    console.error('Database batch error:', error);
    throw new Error('Database batch operation failed');
  }
}

// ==================== User Queries ====================

/**
 * Get user by ID (without password)
 */
export async function getUserById(db: D1Database, userId: string): Promise<User | null> {
  return queryOne<User>(
    db,
    `SELECT id, email, first_name, last_name, role, created_at, updated_at 
     FROM users WHERE id = ?`,
    [userId]
  );
}

/**
 * Get user by email (with password for authentication)
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<UserWithPassword | null> {
  return queryOne<UserWithPassword>(
    db,
    `SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at 
     FROM users WHERE email = ?`,
    [email]
  );
}

/**
 * Create a new user
 */
export async function createUser(
  db: D1Database,
  data: {
    id: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role?: 'customer' | 'admin';
  }
): Promise<User> {
  await execute(
    db,
    `INSERT INTO users (id, email, password_hash, first_name, last_name, role) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.email,
      data.passwordHash,
      data.firstName || null,
      data.lastName || null,
      data.role || 'customer',
    ]
  );
  
  const user = await getUserById(db, data.id);
  if (!user) throw new Error('Failed to create user');
  return user;
}

/**
 * Update user information
 */
export async function updateUser(
  db: D1Database,
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
): Promise<User> {
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.firstName !== undefined) {
    updates.push('first_name = ?');
    params.push(data.firstName);
  }
  if (data.lastName !== undefined) {
    updates.push('last_name = ?');
    params.push(data.lastName);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    params.push(data.email);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(userId);
  
  await execute(
    db,
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  const user = await getUserById(db, userId);
  if (!user) throw new Error('Failed to update user');
  return user;
}

// ==================== Refresh Token Queries ====================

/**
 * Create a refresh token
 */
export async function createRefreshToken(
  db: D1Database,
  data: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
  }
): Promise<void> {
  await execute(
    db,
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
     VALUES (?, ?, ?, ?)`,
    [data.id, data.userId, data.token, data.expiresAt]
  );
}

/**
 * Get refresh token by token value
 */
export async function getRefreshToken(db: D1Database, token: string): Promise<any | null> {
  return queryOne(
    db,
    `SELECT id, user_id, token, expires_at, created_at 
     FROM refresh_tokens WHERE token = ?`,
    [token]
  );
}

/**
 * Delete refresh token
 */
export async function deleteRefreshToken(db: D1Database, token: string): Promise<void> {
  await execute(db, `DELETE FROM refresh_tokens WHERE token = ?`, [token]);
}

/**
 * Delete all expired refresh tokens (cleanup)
 */
export async function deleteExpiredRefreshTokens(db: D1Database): Promise<void> {
  await execute(
    db,
    `DELETE FROM refresh_tokens WHERE expires_at < datetime('now')`
  );
}

// ==================== Category Queries ====================

/**
 * Get all active categories
 */
export async function getCategories(db: D1Database, includeInactive = false): Promise<any[]> {
  const sql = includeInactive
    ? `SELECT * FROM categories ORDER BY display_order, name`
    : `SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name`;
  
  return query(db, sql);
}

/**
 * Get category by ID
 */
export async function getCategoryById(db: D1Database, categoryId: string): Promise<any | null> {
  return queryOne(db, `SELECT * FROM categories WHERE id = ?`, [categoryId]);
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(db: D1Database, slug: string): Promise<any | null> {
  return queryOne(db, `SELECT * FROM categories WHERE slug = ?`, [slug]);
}

// ==================== Product Queries ====================

/**
 * Get all product types with sizes
 */
export async function getProductsWithSizes(db: D1Database): Promise<any[]> {
  const productTypes = await query(
    db,
    `SELECT * FROM product_types WHERE is_active = 1 ORDER BY display_order`
  );
  
  for (const type of productTypes) {
    type.sizes = await query(
      db,
      `SELECT * FROM product_sizes 
       WHERE product_type_id = ? AND is_active = 1 
       ORDER BY display_order`,
      [type.id]
    );
  }
  
  return productTypes;
}

/**
 * Get product size by ID
 */
export async function getProductSizeById(db: D1Database, sizeId: string): Promise<any | null> {
  return queryOne(db, `SELECT * FROM product_sizes WHERE id = ?`, [sizeId]);
}

// ==================== Order Queries ====================

/**
 * Create an order
 */
export async function createOrder(db: D1Database, orderData: any): Promise<string> {
  await execute(
    db,
    `INSERT INTO orders (
      id, user_id, email, status, subtotal, tax, shipping, total,
      shipping_name, shipping_address_line1, shipping_address_line2,
      shipping_city, shipping_state, shipping_postal_code, shipping_country
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderData.id,
      orderData.userId || null,
      orderData.email,
      orderData.status || 'pending',
      orderData.subtotal,
      orderData.tax,
      orderData.shipping,
      orderData.total,
      orderData.shippingName,
      orderData.shippingAddressLine1,
      orderData.shippingAddressLine2 || null,
      orderData.shippingCity,
      orderData.shippingState,
      orderData.shippingPostalCode,
      orderData.shippingCountry || 'US',
    ]
  );
  
  return orderData.id;
}

/**
 * Get order by ID
 */
export async function getOrderById(db: D1Database, orderId: string): Promise<any | null> {
  return queryOne(db, `SELECT * FROM orders WHERE id = ?`, [orderId]);
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  db: D1Database,
  orderId: string,
  status: string,
  additionalData?: any
): Promise<void> {
  const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [status];
  
  if (additionalData?.stripePaymentIntentId) {
    updates.push('stripe_payment_intent_id = ?');
    params.push(additionalData.stripePaymentIntentId);
  }
  if (additionalData?.stripeSessionId) {
    updates.push('stripe_session_id = ?');
    params.push(additionalData.stripeSessionId);
  }
  if (additionalData?.bayPhotoOrderId) {
    updates.push('bay_photo_order_id = ?');
    params.push(additionalData.bayPhotoOrderId);
  }
  
  params.push(orderId);
  
  await execute(
    db,
    `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}
