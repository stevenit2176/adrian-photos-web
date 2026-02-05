var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// lib/auth.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const combined = new Uint8Array([...salt, ...data]);
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function comparePassword(password, storedHash) {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) {
      return false;
    }
    const [saltHex, expectedHashHex] = parts;
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const combined = new Uint8Array([...salt, ...passwordData]);
    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return computedHashHex === expectedHashHex;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}
__name(comparePassword, "comparePassword");
async function generateAccessToken(userId, email, role, secret, expiresIn = "15m") {
  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + parseExpiry(expiresIn)
  };
  return await signJWT(payload, secret);
}
__name(generateAccessToken, "generateAccessToken");
async function generateRefreshToken(userId, email, role, secret, expiresIn = "7d") {
  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + parseExpiry(expiresIn)
  };
  return await signJWT(payload, secret);
}
__name(generateRefreshToken, "generateRefreshToken");
async function verifyToken(token, secret) {
  try {
    const payload = await verifyJWT(token, secret);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      throw new Error("Token expired");
    }
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
__name(verifyToken, "verifyToken");
function parseExpiry(expiry) {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}
__name(parseExpiry, "parseExpiry");
async function signJWT(payload, secret) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureB64 = base64UrlEncode(signature);
  return `${data}.${signatureB64}`;
}
__name(signJWT, "signJWT");
async function verifyJWT(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const encoder = new TextEncoder();
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = base64UrlDecode(signatureB64);
  const isValid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
  if (!isValid) {
    throw new Error("Invalid signature");
  }
  const payload = JSON.parse(base64UrlDecodeString(payloadB64));
  return payload;
}
__name(verifyJWT, "verifyJWT");
function base64UrlEncode(data) {
  let binary;
  if (typeof data === "string") {
    binary = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    binary = btoa(String.fromCharCode(...bytes));
  }
  return binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(data) {
  const binary = data.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - binary.length % 4) % 4);
  const decoded = atob(binary + padding);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(base64UrlDecode, "base64UrlDecode");
function base64UrlDecodeString(data) {
  const binary = data.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - binary.length % 4) % 4);
  return atob(binary + padding);
}
__name(base64UrlDecodeString, "base64UrlDecodeString");
function extractToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
__name(extractToken, "extractToken");
async function getAuthUser(request, env) {
  const token = extractToken(request);
  if (!token) {
    throw new Error("No token provided");
  }
  return await verifyToken(token, env.JWT_SECRET);
}
__name(getAuthUser, "getAuthUser");
function isAdmin(user) {
  return user.role === "admin";
}
__name(isAdmin, "isAdmin");

// lib/utils.ts
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");
function successResponse(data, status = 200) {
  const response = {
    success: true,
    data
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(successResponse, "successResponse");
function errorResponse(message, status = 500, code = "SERVER_ERROR", details) {
  const error = {
    message,
    code,
    ...details && { details }
  };
  const response = {
    success: false,
    error
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(errorResponse, "errorResponse");
async function parseJsonBody(request) {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}
__name(parseJsonBody, "parseJsonBody");
function toCamelCase(obj) {
  if (obj === null || obj === void 0)
    return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item));
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
}
__name(toCamelCase, "toCamelCase");
function paginate(items, page = 1, limit = 20) {
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
    hasMore: page < pages
  };
}
__name(paginate, "paginate");
function getQueryParams(request) {
  const url = new URL(request.url);
  return url.searchParams;
}
__name(getQueryParams, "getQueryParams");

// lib/middleware.ts
async function requireAuth(request, env) {
  try {
    const user = await getAuthUser(request, env);
    return user;
  } catch (error) {
    throw new AuthError("Authentication required");
  }
}
__name(requireAuth, "requireAuth");
async function requireAdmin(request, env) {
  const user = await requireAuth(request, env);
  if (!isAdmin(user)) {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}
__name(requireAdmin, "requireAdmin");
async function optionalAuth(request, env) {
  try {
    const user = await getAuthUser(request, env);
    return user;
  } catch (error) {
    return null;
  }
}
__name(optionalAuth, "optionalAuth");
function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function handleCorsPreflightRequest() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}
__name(handleCorsPreflightRequest, "handleCorsPreflightRequest");
function addCorsHeaders(response) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders();
  Object.entries(cors).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(addCorsHeaders, "addCorsHeaders");
var AuthError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
  }
};
__name(AuthError, "AuthError");
var ForbiddenError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
  }
};
__name(ForbiddenError, "ForbiddenError");
var ValidationError = class extends Error {
  details;
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
};
__name(ValidationError, "ValidationError");

// lib/frameiteasy.ts
async function frameItEasyRequest(env, endpoint, method = "GET", body) {
  const apiUrl = env.FRAMEITEASY_API_URL || "https://api.sandbox.frameiteasy.com";
  const apiKey = env.FRAMEITEASY_API_KEY || "sandbox@frameiteasy.com:0Az9*MtXQo";
  const url = `${apiUrl}/v1${endpoint}`;
  const base64Credentials = btoa(apiKey);
  console.log("[FrameItEasy] Request:", method, url);
  console.log("[FrameItEasy] API Key exists:", !!apiKey);
  console.log("[FrameItEasy] Base64 length:", base64Credentials.length);
  const headers = {
    "Authorization": `Basic ${base64Credentials}`
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : void 0
  });
  console.log("[FrameItEasy] Response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[FrameItEasy] Error:", response.status, errorText);
    throw new Error(`Frame It Easy API error: ${response.status} - ${errorText}`);
  }
  return await response.json();
}
__name(frameItEasyRequest, "frameItEasyRequest");
async function getFrameItems(env) {
  return await frameItEasyRequest(env, "/items", "GET");
}
__name(getFrameItems, "getFrameItems");
async function calculateFramePrice(env, config) {
  return await frameItEasyRequest(env, "/items", "POST", config);
}
__name(calculateFramePrice, "calculateFramePrice");
async function createFrameOrder(env, orderData) {
  return await frameItEasyRequest(env, "/orders", "POST", orderData);
}
__name(createFrameOrder, "createFrameOrder");
async function getFrameOrder(env, orderId) {
  return await frameItEasyRequest(env, `/orders/${orderId}`, "GET");
}
__name(getFrameOrder, "getFrameOrder");

// lib/db.ts
async function query(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    if (!result.results) {
      return [];
    }
    return result.results.map((row) => toCamelCase(row));
  } catch (error) {
    console.error("Database query error:", error);
    throw new Error("Database query failed");
  }
}
__name(query, "query");
async function queryOne(db, sql, params = []) {
  const results = await query(db, sql, params);
  return results.length > 0 ? results[0] : null;
}
__name(queryOne, "queryOne");
async function queryAll(db, sql, params = []) {
  return query(db, sql, params);
}
__name(queryAll, "queryAll");
async function execute(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    return await bound.run();
  } catch (error) {
    console.error("Database execute error:", error);
    throw new Error("Database operation failed");
  }
}
__name(execute, "execute");
async function getUserById(db, userId) {
  return queryOne(
    db,
    `SELECT id, email, first_name, last_name, role, created_at, updated_at 
     FROM users WHERE id = ?`,
    [userId]
  );
}
__name(getUserById, "getUserById");
async function getUserByEmail(db, email) {
  return queryOne(
    db,
    `SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at 
     FROM users WHERE email = ?`,
    [email]
  );
}
__name(getUserByEmail, "getUserByEmail");
async function createUser(db, data) {
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
      data.role || "customer"
    ]
  );
  const user = await getUserById(db, data.id);
  if (!user)
    throw new Error("Failed to create user");
  return user;
}
__name(createUser, "createUser");
async function createRefreshToken(db, data) {
  await execute(
    db,
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
     VALUES (?, ?, ?, ?)`,
    [data.id, data.userId, data.token, data.expiresAt]
  );
}
__name(createRefreshToken, "createRefreshToken");
async function getRefreshToken(db, token) {
  return queryOne(
    db,
    `SELECT id, user_id, token, expires_at, created_at 
     FROM refresh_tokens WHERE token = ?`,
    [token]
  );
}
__name(getRefreshToken, "getRefreshToken");
async function deleteRefreshToken(db, token) {
  await execute(db, `DELETE FROM refresh_tokens WHERE token = ?`, [token]);
}
__name(deleteRefreshToken, "deleteRefreshToken");
async function getCategories(db, includeInactive = false) {
  const sql = includeInactive ? `SELECT c.*, COUNT(pc.photo_id) as photo_count 
       FROM categories c 
       LEFT JOIN photos_categories pc ON c.id = pc.category_id 
       GROUP BY c.id 
       ORDER BY c.display_order, c.name` : `SELECT c.*, COUNT(pc.photo_id) as photo_count 
       FROM categories c 
       LEFT JOIN photos_categories pc ON c.id = pc.category_id 
       WHERE c.is_active = 1 
       GROUP BY c.id 
       ORDER BY c.display_order, c.name`;
  return query(db, sql);
}
__name(getCategories, "getCategories");
async function getProductsWithSizes(db) {
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
__name(getProductsWithSizes, "getProductsWithSizes");

// api/fulfillment/orders/[id].ts
async function onRequestGet(context) {
  try {
    const { request, env, params } = context;
    const user = await requireAuth(request, env);
    const orderId = params.id;
    if (!orderId) {
      return errorResponse("Order ID is required", 400, "VALIDATION_ERROR");
    }
    const order = await queryOne(
      env.DB,
      `SELECT 
        id, user_id, frameiteasy_order_id, frameiteasy_order_number,
        status, total_amount, shipping_address, created_at, updated_at
       FROM orders 
       WHERE id = ?`,
      [orderId]
    );
    if (!order) {
      return errorResponse("Order not found", 404, "NOT_FOUND");
    }
    if (order.user_id !== user.userId) {
      return errorResponse("Unauthorized", 403, "FORBIDDEN");
    }
    const frameItEasyOrder = await getFrameOrder(env, order.frameiteasy_order_id);
    if (frameItEasyOrder.status !== order.status) {
      await execute(
        env.DB,
        "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
        [frameItEasyOrder.status, (/* @__PURE__ */ new Date()).toISOString(), orderId]
      );
    }
    const itemsResult = await env.DB.prepare(
      `SELECT 
        oi.id, oi.photo_id, oi.sku, oi.quantity,
        p.title as photo_title, p.r2_key
       FROM order_items oi
       LEFT JOIN photos p ON oi.photo_id = p.id
       WHERE oi.order_id = ?`
    ).bind(orderId).all();
    return successResponse({
      order: {
        ...order,
        status: frameItEasyOrder.status,
        shipping_tracking: frameItEasyOrder.shipping_tracking,
        shipping_carrier: frameItEasyOrder.shipping_carrier,
        items: itemsResult.results || []
      },
      frameiteasy_order: frameItEasyOrder,
      message: "Order details retrieved successfully"
    });
  } catch (error) {
    console.error("Get order error:", error);
    return errorResponse(
      `Failed to retrieve order: ${error.message}`,
      500,
      "ORDER_ERROR"
    );
  }
}
__name(onRequestGet, "onRequestGet");

// api/categories/[id]/delete.ts
async function onRequestDelete(context) {
  try {
    const { request, env, params } = context;
    const user = await requireAdmin(request, env);
    const categoryId = params.id;
    const category = await queryOne(env.DB, `
      SELECT id, image_r2_key FROM categories WHERE id = ?
    `, [categoryId]);
    if (!category) {
      return errorResponse("Category not found", 404, "NOT_FOUND");
    }
    const photoCount = await queryOne(env.DB, `
      SELECT COUNT(*) as count FROM photos_categories WHERE category_id = ?
    `, [categoryId]);
    if (photoCount && photoCount.count > 0) {
      return errorResponse(
        "Cannot delete category with associated photos. Please reassign or delete photos first.",
        400,
        "CATEGORY_HAS_PHOTOS"
      );
    }
    if (category.imageR2Key) {
      try {
        await env.R2.delete(category.imageR2Key);
      } catch (error) {
        console.error("Error deleting category image from R2:", error);
      }
    }
    await execute(env.DB, `
      DELETE FROM categories WHERE id = ?
    `, [categoryId]);
    return successResponse({
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return errorResponse(`Failed to delete category: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestDelete, "onRequestDelete");

// api/categories/[id]/update.ts
async function onRequestPut(context) {
  try {
    const { request, env, params } = context;
    const user = await requireAdmin(request, env);
    const categoryId = params.id;
    const body = await request.json();
    const { name, slug, description, displayOrder, isActive, imageR2Key, imageAltText } = body;
    if (!name || !slug) {
      return errorResponse("Name and slug are required", 400, "VALIDATION_ERROR");
    }
    const existingCategory = await queryOne(env.DB, `
      SELECT id FROM categories WHERE id = ?
    `, [categoryId]);
    if (!existingCategory) {
      return errorResponse("Category not found", 404, "NOT_FOUND");
    }
    const slugCheck = await queryOne(env.DB, `
      SELECT id FROM categories WHERE slug = ? AND id != ?
    `, [slug, categoryId]);
    if (slugCheck) {
      return errorResponse("Slug already in use by another category", 400, "DUPLICATE_SLUG");
    }
    await execute(env.DB, `
      UPDATE categories
      SET name = ?,
          slug = ?,
          description = ?,
          display_order = ?,
          is_active = ?,
          image_r2_key = ?,
          image_alt_text = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      slug,
      description || null,
      displayOrder !== void 0 ? displayOrder : 0,
      isActive !== false ? 1 : 0,
      imageR2Key || null,
      imageAltText || null,
      categoryId
    ]);
    const category = await queryOne(env.DB, `
      SELECT id, name, slug, description, display_order, is_active,
             image_r2_key, image_alt_text, created_at, updated_at
      FROM categories
      WHERE id = ?
    `, [categoryId]);
    return successResponse({
      category
    });
  } catch (error) {
    console.error("Update category error:", error);
    return errorResponse(`Failed to update category: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPut, "onRequestPut");

// lib/r2.ts
async function uploadToR2(r2, key, file, contentType, metadata) {
  await r2.put(key, file, {
    httpMetadata: {
      contentType
    },
    customMetadata: metadata
  });
  return {
    key,
    url: `/photos/${key}`,
    size: file.byteLength,
    contentType
  };
}
__name(uploadToR2, "uploadToR2");
async function getFromR2(r2, key) {
  return await r2.get(key);
}
__name(getFromR2, "getFromR2");
async function deleteFromR2(r2, key) {
  await r2.delete(key);
}
__name(deleteFromR2, "deleteFromR2");
function generatePhotoKey(originalFilename, userId) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = originalFilename.split(".").pop()?.toLowerCase() || "jpg";
  return `photos/${userId}/${timestamp}-${randomStr}.${ext}`;
}
__name(generatePhotoKey, "generatePhotoKey");
function isValidImageType(contentType) {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
  ];
  return validTypes.includes(contentType.toLowerCase());
}
__name(isValidImageType, "isValidImageType");
function isValidImageSize(size, maxSize = 10 * 1024 * 1024) {
  return size > 0 && size <= maxSize;
}
__name(isValidImageSize, "isValidImageSize");

// api/photos/[id]/delete.ts
async function onRequestDelete2(context) {
  try {
    const { request, params, env } = context;
    await requireAdmin(request, env);
    const photoId = params.id;
    if (!photoId) {
      return errorResponse("Photo ID is required", 400, "VALIDATION_ERROR");
    }
    const photo = await queryOne(env.DB, "SELECT id, r2_key FROM photos WHERE id = ?", [photoId]);
    if (!photo) {
      return errorResponse("Photo not found", 404, "NOT_FOUND");
    }
    if (photo.r2_key) {
      await deleteFromR2(env.R2, photo.r2_key);
    }
    await execute(env.DB, "DELETE FROM photos WHERE id = ?", [photoId]);
    return successResponse({
      message: "Photo deleted successfully",
      photoId
    });
  } catch (error) {
    console.error("Delete photo error:", error);
    return errorResponse(`Failed to delete photo: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestDelete2, "onRequestDelete");

// api/photos/[id]/update.ts
async function onRequestPut2(context) {
  try {
    const { request, params, env } = context;
    await requireAdmin(request, env);
    const photoId = params.id;
    if (!photoId) {
      return errorResponse("Photo ID is required", 400, "VALIDATION_ERROR");
    }
    const body = await parseJsonBody(request);
    const existing = await queryOne(env.DB, "SELECT id FROM photos WHERE id = ?", [photoId]);
    if (!existing) {
      return errorResponse("Photo not found", 404, "NOT_FOUND");
    }
    const updates = [];
    const sqlParams = [];
    if (body.title !== void 0) {
      updates.push("title = ?");
      sqlParams.push(body.title);
    }
    if (body.description !== void 0) {
      updates.push("description = ?");
      sqlParams.push(body.description);
    }
    if (body.price !== void 0) {
      updates.push("price = ?");
      sqlParams.push(body.price);
    }
    if (body.isActive !== void 0) {
      updates.push("is_active = ?");
      sqlParams.push(body.isActive ? 1 : 0);
    }
    if (updates.length === 0 && !body.categoryIds) {
      return errorResponse("No fields to update", 400, "VALIDATION_ERROR");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (updates.length > 0) {
      updates.push("updated_at = ?");
      sqlParams.push(now);
      sqlParams.push(photoId);
      await execute(
        env.DB,
        `UPDATE photos SET ${updates.join(", ")} WHERE id = ?`,
        sqlParams
      );
    }
    if (body.categoryIds !== void 0) {
      if (!body.categoryIds || body.categoryIds.length === 0) {
        return errorResponse("At least one category is required", 400, "VALIDATION_ERROR");
      }
      await execute(env.DB, "DELETE FROM photos_categories WHERE photo_id = ?", [photoId]);
      for (const categoryId of body.categoryIds) {
        await execute(env.DB, `
          INSERT INTO photos_categories (photo_id, category_id, created_at)
          VALUES (?, ?, ?)
        `, [photoId, categoryId, now]);
      }
    }
    const updated = await queryOne(env.DB, `
      SELECT 
        p.id, p.title, p.description, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at
      FROM photos p
      WHERE p.id = ?
    `, [photoId]);
    const categories = await queryAll(env.DB, `
      SELECT c.id, c.name
      FROM categories c
      INNER JOIN photos_categories pc ON c.id = pc.category_id
      WHERE pc.photo_id = ?
    `, [photoId]);
    return successResponse({
      photo: {
        ...updated,
        categoryIds: categories.map((c) => c.id),
        categoryNames: categories.map((c) => c.name)
      }
    });
  } catch (error) {
    console.error("Update photo error:", error);
    return errorResponse(`Failed to update photo: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPut2, "onRequestPut");

// api/analytics/stats.ts
var onRequestGet2 = /* @__PURE__ */ __name(async ({ env }) => {
  try {
    console.log("[Analytics API] Stats endpoint called");
    const stats = {
      totalVisitors: 12847,
      visitorsToday: 342,
      visitorsThisWeek: 2156,
      visitorsThisMonth: 8945,
      pageViews: 45231,
      avgSessionDuration: 245,
      // in seconds
      topPages: [
        { path: "/gallery", views: 8234 },
        { path: "/categories/landscapes", views: 5621 },
        { path: "/photos/photo-123", views: 3892 },
        { path: "/categories/portraits", views: 2745 },
        { path: "/cart", views: 1523 }
      ]
    };
    console.log("[Analytics API] Returning stats:", stats);
    const response = successResponse(stats);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  } catch (error) {
    console.error("[Analytics Stats] Error:", error);
    const errorRes = errorResponse("Failed to fetch analytics stats", 500);
    errorRes.headers.set("Access-Control-Allow-Origin", "*");
    return errorRes;
  }
}, "onRequestGet");
var onRequestOptions = /* @__PURE__ */ __name(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}, "onRequestOptions");

// lib/validation.ts
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
function getPasswordError(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}
__name(getPasswordError, "getPasswordError");

// api/auth/login.ts
async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await parseJsonBody(request);
    if (!body.email || !body.password) {
      throw new ValidationError("Email and password are required");
    }
    if (!isValidEmail(body.email)) {
      throw new ValidationError("Invalid email format");
    }
    const user = await getUserByEmail(env.DB, body.email.toLowerCase());
    if (!user) {
      return errorResponse("Invalid credentials", 401, "AUTH_INVALID");
    }
    const isValidPassword = await comparePassword(body.password, user.passwordHash);
    if (!isValidPassword) {
      return errorResponse("Invalid credentials", 401, "AUTH_INVALID");
    }
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
    const refreshTokenId = generateId();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await createRefreshToken(env.DB, {
      id: refreshTokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: expiresAt.toISOString()
    });
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, "VALIDATION_ERROR");
    }
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    return errorResponse(`Login failed: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPost, "onRequestPost");

// api/auth/logout.ts
async function onRequestPost2(context) {
  try {
    const { request, env } = context;
    const body = await parseJsonBody(request);
    if (!body.refreshToken) {
      throw new ValidationError("Refresh token is required");
    }
    await deleteRefreshToken(env.DB, body.refreshToken);
    return successResponse({
      message: "Logged out successfully"
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, "VALIDATION_ERROR");
    }
    console.error("Logout error:", error);
    return successResponse({
      message: "Logged out successfully"
    });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/auth/me.ts
async function onRequestGet3(context) {
  try {
    const { request, env } = context;
    const authUser = await requireAuth(request, env);
    const user = await getUserById(env.DB, authUser.userId);
    if (!user) {
      return errorResponse("User not found", 404, "NOT_FOUND");
    }
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    if (error.message === "Authentication required") {
      return errorResponse("Authentication required", 401, "AUTH_REQUIRED");
    }
    return errorResponse("Failed to get user", 500, "SERVER_ERROR");
  }
}
__name(onRequestGet3, "onRequestGet");

// api/auth/refresh.ts
async function onRequestPost3(context) {
  try {
    const { request, env } = context;
    const body = await parseJsonBody(request);
    if (!body.refreshToken) {
      throw new ValidationError("Refresh token is required");
    }
    let payload;
    try {
      payload = await verifyToken(body.refreshToken, env.JWT_SECRET);
    } catch (error) {
      throw new AuthError("Invalid refresh token");
    }
    const storedToken = await getRefreshToken(env.DB, body.refreshToken);
    if (!storedToken) {
      throw new AuthError("Refresh token not found");
    }
    const expiresAt = new Date(storedToken.expiresAt);
    if (expiresAt < /* @__PURE__ */ new Date()) {
      await deleteRefreshToken(env.DB, body.refreshToken);
      throw new AuthError("Refresh token expired");
    }
    const user = await getUserById(env.DB, payload.userId);
    if (!user) {
      await deleteRefreshToken(env.DB, body.refreshToken);
      throw new AuthError("User not found");
    }
    await deleteRefreshToken(env.DB, body.refreshToken);
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
    const refreshTokenId = generateId();
    const newExpiresAt = /* @__PURE__ */ new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    await createRefreshToken(env.DB, {
      id: refreshTokenId,
      userId: user.id,
      token: newRefreshToken,
      expiresAt: newExpiresAt.toISOString()
    });
    return successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, "VALIDATION_ERROR");
    }
    if (error instanceof AuthError) {
      return errorResponse(error.message, 401, "AUTH_INVALID");
    }
    console.error("Refresh error:", error);
    return errorResponse("Token refresh failed", 500, "SERVER_ERROR");
  }
}
__name(onRequestPost3, "onRequestPost");

// api/auth/register.ts
async function onRequestPost4(context) {
  try {
    const { request, env } = context;
    const body = await parseJsonBody(request);
    if (!body.email || !body.password) {
      throw new ValidationError("Email and password are required");
    }
    if (!isValidEmail(body.email)) {
      throw new ValidationError("Invalid email format");
    }
    const passwordError = getPasswordError(body.password);
    if (passwordError) {
      throw new ValidationError(passwordError);
    }
    const existingUser = await getUserByEmail(env.DB, body.email);
    if (existingUser) {
      throw new ValidationError("Email already registered");
    }
    const passwordHash = await hashPassword(body.password);
    const userId = generateId();
    const user = await createUser(env.DB, {
      id: userId,
      email: body.email.toLowerCase(),
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: "customer"
    });
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
    const refreshTokenId = generateId();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await createRefreshToken(env.DB, {
      id: refreshTokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: expiresAt.toISOString()
    });
    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        accessToken,
        refreshToken
      },
      201
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400, "VALIDATION_ERROR");
    }
    console.error("Register error:", error);
    return errorResponse("Registration failed", 500, "SERVER_ERROR");
  }
}
__name(onRequestPost4, "onRequestPost");

// api/cart/calculate.ts
async function onRequestPost5(context) {
  try {
    const { request } = context;
    const body = await parseJsonBody(request);
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse("Cart items are required", 400, "VALIDATION_ERROR");
    }
    const subtotal = body.items.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);
    let taxRate = 0;
    if (body.shippingState) {
      const state = body.shippingState.toUpperCase().trim();
      if (state === "CA" || state === "CALIFORNIA") {
        taxRate = 0.08;
      }
    }
    const tax = Math.round(subtotal * taxRate);
    const shipping = 1500;
    const total = subtotal + tax + shipping;
    return successResponse({
      subtotal,
      tax,
      taxRate,
      shipping,
      total,
      itemCount: body.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error("Calculate cart error:", error);
    return errorResponse(`Failed to calculate cart: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPost5, "onRequestPost");

// api/categories/create.ts
async function onRequestPost6(context) {
  try {
    const { request, env } = context;
    const user = await requireAdmin(request, env);
    const body = await request.json();
    const { name, slug, description, displayOrder, isActive, imageR2Key, imageAltText } = body;
    if (!name || !slug) {
      return errorResponse("Name and slug are required", 400, "VALIDATION_ERROR");
    }
    const existingCategory = await env.DB.prepare(
      "SELECT id FROM categories WHERE slug = ?"
    ).bind(slug).first();
    if (existingCategory) {
      return errorResponse("Category with this slug already exists", 400, "DUPLICATE_SLUG");
    }
    const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await execute(env.DB, `
      INSERT INTO categories (
        id, name, slug, description, display_order, is_active,
        image_r2_key, image_alt_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      name,
      slug,
      description || null,
      displayOrder || 0,
      isActive !== false ? 1 : 0,
      imageR2Key || null,
      imageAltText || null
    ]);
    const category = await env.DB.prepare(`
      SELECT id, name, slug, description, display_order, is_active,
             image_r2_key, image_alt_text, created_at, updated_at
      FROM categories
      WHERE id = ?
    `).bind(id).first();
    return successResponse({
      category
    }, 201);
  } catch (error) {
    console.error("Create category error:", error);
    return errorResponse(`Failed to create category: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPost6, "onRequestPost");

// api/categories/upload-image.ts
var ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
var MAX_FILE_SIZE = 10 * 1024 * 1024;
async function onRequestPost7(context) {
  try {
    const { request, env } = context;
    const user = await requireAdmin(request, env);
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file) {
      return errorResponse("No image file provided", 400, "NO_FILE");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        "Invalid file type. Allowed types: JPEG, PNG, WebP, GIF",
        400,
        "INVALID_FILE_TYPE"
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        "File size exceeds 10MB limit",
        400,
        "FILE_TOO_LARGE"
      );
    }
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "jpg";
    const r2Key = `categories/${user.userId}/${timestamp}-${randomStr}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });
    return successResponse({
      r2Key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });
  } catch (error) {
    console.error("Upload category image error:", error);
    return errorResponse(`Failed to upload image: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPost7, "onRequestPost");

// api/fulfillment/calculate.ts
async function onRequestPost8(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    if (!body.profile || !body.color || !body.width || !body.height) {
      return errorResponse(
        "Missing required fields: profile, color, width, height",
        400,
        "VALIDATION_ERROR"
      );
    }
    const frameDetails = await calculateFramePrice(env, body);
    return successResponse({
      frame: frameDetails,
      message: "Frame price calculated successfully"
    });
  } catch (error) {
    console.error("Calculate frame price error:", error);
    return errorResponse(
      `Failed to calculate frame price: ${error.message}`,
      500,
      "FRAMEITEASY_ERROR"
    );
  }
}
__name(onRequestPost8, "onRequestPost");

// api/fulfillment/items.ts
async function onRequestGet4(context) {
  try {
    const { env } = context;
    console.log("[Items Endpoint] Starting getFrameItems call...");
    try {
      const items = await getFrameItems(env);
      console.log("[Items Endpoint] Success, items:", JSON.stringify(items).substring(0, 200));
      return successResponse({
        items,
        message: "Frame items retrieved successfully"
      });
    } catch (apiError) {
      console.warn("[Items Endpoint] Frame It Easy API unavailable, using mock data");
      const mockItems = {
        styles: [
          { id: "classic-black", name: "Classic Black", price: 29.99 },
          { id: "modern-white", name: "Modern White", price: 34.99 },
          { id: "rustic-wood", name: "Rustic Wood", price: 39.99 },
          { id: "elegant-gold", name: "Elegant Gold", price: 44.99 }
        ],
        colors: [
          { id: "black", name: "Black" },
          { id: "white", name: "White" },
          { id: "natural", name: "Natural Wood" },
          { id: "gold", name: "Gold" }
        ],
        mats: [
          { id: "none", name: "No Mat", price: 0 },
          { id: "single-white", name: "Single White Mat", price: 15 },
          { id: "double-cream", name: "Double Cream Mat", price: 25 }
        ],
        covers: [
          { id: "none", name: "No Cover", price: 0 },
          { id: "acrylic", name: "Acrylic", price: 20 },
          { id: "museum-glass", name: "Museum Glass", price: 50 }
        ],
        backings: [
          { id: "standard", name: "Standard Backing", price: 0 },
          { id: "foam-core", name: "Foam Core", price: 10 }
        ]
      };
      return successResponse({
        items: mockItems,
        message: "Frame items retrieved (mock data - Frame It Easy API unavailable)"
      });
    }
  } catch (error) {
    console.error("[Items Endpoint] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return errorResponse(
      `Failed to retrieve frame items: ${error.message}`,
      500,
      "FRAMEITEASY_ERROR"
    );
  }
}
__name(onRequestGet4, "onRequestGet");

// api/fulfillment/orders.ts
async function onRequestPost9(context) {
  try {
    const { request, env } = context;
    const user = await requireAuth(request, env);
    const body = await request.json();
    if (!body.items || !body.items.length) {
      return errorResponse("At least one item is required", 400, "VALIDATION_ERROR");
    }
    if (!body.shipping || !body.shipping.first_name || !body.shipping.last_name || !body.shipping.address1 || !body.shipping.city || !body.shipping.state || !body.shipping.zip || !body.shipping.email) {
      return errorResponse("Complete shipping information is required", 400, "VALIDATION_ERROR");
    }
    const orderItems = await Promise.all(
      body.items.map(async (item) => {
        const photo = await queryOne(
          env.DB,
          "SELECT id, r2_key FROM photos WHERE id = ?",
          [item.photo_id]
        );
        if (!photo) {
          throw new Error(`Photo not found: ${item.photo_id}`);
        }
        const imageUrl = `${new URL(request.url).origin}/api/photos/image?key=${encodeURIComponent(photo.r2_key)}`;
        return {
          sku: item.sku,
          quantity: item.quantity,
          image_url: imageUrl
        };
      })
    );
    const frameItEasyOrder = await createFrameOrder(env, {
      items: orderItems,
      shipping: {
        ...body.shipping,
        country: body.shipping.country || "US"
      }
    });
    const orderId = generateId("ord");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await execute(
      env.DB,
      `INSERT INTO orders (
        id, user_id, frameiteasy_order_id, frameiteasy_order_number,
        status, total_amount, shipping_address, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        user.userId,
        frameItEasyOrder.id,
        frameItEasyOrder.order_number,
        frameItEasyOrder.status,
        parseFloat(frameItEasyOrder.total),
        JSON.stringify(body.shipping),
        now,
        now
      ]
    );
    for (const item of body.items) {
      await execute(
        env.DB,
        `INSERT INTO order_items (
          id, order_id, photo_id, sku, quantity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          generateId("itm"),
          orderId,
          item.photo_id,
          item.sku,
          item.quantity,
          now
        ]
      );
    }
    return successResponse({
      order_id: orderId,
      frameiteasy_order: frameItEasyOrder,
      message: "Order created successfully"
    });
  } catch (error) {
    console.error("Create order error:", error);
    return errorResponse(
      `Failed to create order: ${error.message}`,
      500,
      "ORDER_ERROR"
    );
  }
}
__name(onRequestPost9, "onRequestPost");
async function onRequestGet5(context) {
  try {
    const { request, env } = context;
    const user = await requireAuth(request, env);
    const result = await env.DB.prepare(
      `SELECT 
        id, frameiteasy_order_id, frameiteasy_order_number,
        status, total_amount, shipping_address, created_at, updated_at
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`
    ).bind(user.userId).all();
    const orders = result.results || [];
    return successResponse({
      orders,
      count: orders.length,
      message: "Orders retrieved successfully"
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return errorResponse(
      `Failed to retrieve orders: ${error.message}`,
      500,
      "ORDER_ERROR"
    );
  }
}
__name(onRequestGet5, "onRequestGet");

// api/photos/image.ts
async function onRequestGet6(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    let r2Key = url.searchParams.get("key");
    if (!r2Key) {
      const pathMatch = url.pathname.match(/\/api\/photos\/image\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        r2Key = decodeURIComponent(pathMatch[1]);
      }
    }
    if (!r2Key) {
      return errorResponse("Image path is required", 400, "INVALID_REQUEST");
    }
    const object = await getFromR2(env.R2, r2Key);
    if (!object) {
      return errorResponse("Image not found", 404, "NOT_FOUND");
    }
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", object.httpEtag);
    return new Response(object.body, {
      headers,
      status: 200
    });
  } catch (error) {
    console.error("Serve image error:", error);
    return errorResponse(`Failed to serve image: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestGet6, "onRequestGet");

// api/photos/upload.ts
async function onRequestPost10(context) {
  try {
    const { request, env } = context;
    const user = await requireAdmin(request, env);
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description");
    const categoryIdsStr = formData.get("categoryIds");
    const categoryIds = categoryIdsStr ? JSON.parse(categoryIdsStr) : [];
    const price = formData.get("price") ? parseFloat(formData.get("price")) : null;
    const isActive = formData.get("isActive") !== "false";
    const replacePhotoId = formData.get("replacePhotoId");
    if (!file) {
      return errorResponse("No file uploaded", 400, "VALIDATION_ERROR");
    }
    if (!isValidImageType(file.type)) {
      return errorResponse("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.", 400, "VALIDATION_ERROR");
    }
    if (!isValidImageSize(file.size)) {
      return errorResponse("File too large. Maximum size is 10MB.", 400, "VALIDATION_ERROR");
    }
    if (!title || !categoryIds || categoryIds.length === 0) {
      return errorResponse("Title and at least one category are required", 400, "VALIDATION_ERROR");
    }
    const photoKey = generatePhotoKey(file.name, user.userId);
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToR2(
      env.R2,
      photoKey,
      arrayBuffer,
      file.type,
      {
        uploadedBy: user.userId,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (replacePhotoId) {
      const oldPhoto = await queryOne(env.DB, "SELECT r2_key FROM photos WHERE id = ?", [replacePhotoId]);
      if (oldPhoto) {
        try {
          await deleteFromR2(env.R2, oldPhoto.r2_key);
        } catch (err) {
          console.error("Failed to delete old R2 file:", err);
        }
        await execute(env.DB, `
          UPDATE photos 
          SET title = ?, description = ?, r2_key = ?, 
              file_size = ?, mime_type = ?, price = ?, is_active = ?, updated_at = ?
          WHERE id = ?
        `, [
          title,
          description || null,
          uploadResult.key,
          uploadResult.size,
          uploadResult.contentType,
          price || null,
          isActive ? 1 : 0,
          now,
          replacePhotoId
        ]);
        await execute(env.DB, "DELETE FROM photos_categories WHERE photo_id = ?", [replacePhotoId]);
        for (const categoryId of categoryIds) {
          await execute(env.DB, `
            INSERT INTO photos_categories (photo_id, category_id, created_at)
            VALUES (?, ?, ?)
          `, [replacePhotoId, categoryId, now]);
        }
        return successResponse({
          photo: {
            id: replacePhotoId,
            title,
            description,
            categoryIds,
            r2Key: uploadResult.key,
            fileSize: uploadResult.size,
            mimeType: uploadResult.contentType,
            price,
            isActive,
            updatedAt: now
          }
        });
      }
    }
    const photoId = generateId();
    await execute(env.DB, `
      INSERT INTO photos (
        id, title, description, r2_key, file_size, 
        mime_type, price, is_active, uploaded_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      photoId,
      title,
      description || null,
      uploadResult.key,
      uploadResult.size,
      uploadResult.contentType,
      price || null,
      isActive ? 1 : 0,
      user.userId,
      now,
      now
    ]);
    for (const categoryId of categoryIds) {
      await execute(env.DB, `
        INSERT INTO photos_categories (photo_id, category_id, created_at)
        VALUES (?, ?, ?)
      `, [photoId, categoryId, now]);
    }
    return successResponse({
      photo: {
        id: photoId,
        title,
        description,
        categoryIds,
        r2Key: uploadResult.key,
        fileSize: uploadResult.size,
        mimeType: uploadResult.contentType,
        price,
        isActive,
        uploadedBy: user.userId,
        createdAt: now
      }
    }, 201);
  } catch (error) {
    console.error("Photo upload error:", error);
    return errorResponse(`Upload failed: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPost10, "onRequestPost");

// api/products/pricing.ts
async function onRequestGet7(context) {
  try {
    const { env } = context;
    const products = await getProductsWithSizes(env.DB);
    return successResponse({
      products
    });
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse("Failed to get products", 500, "SERVER_ERROR");
  }
}
__name(onRequestGet7, "onRequestGet");

// api/categories/[id].ts
async function onRequestGet8(context) {
  try {
    const { env, params } = context;
    const idOrSlug = params.id;
    console.log("Category ID/Slug requested:", idOrSlug);
    if (!idOrSlug) {
      return errorResponse("Category ID or slug is required", 400, "VALIDATION_ERROR");
    }
    const result = await env.DB.prepare(
      `SELECT id, name, slug, description, display_order as displayOrder, 
              is_active as isActive, image_r2_key as imageR2Key, image_alt_text as imageAltText,
              created_at as createdAt, updated_at as updatedAt
       FROM categories 
       WHERE (id = ? OR slug = ?) AND is_active = 1`
    ).bind(idOrSlug, idOrSlug).first();
    console.log("Category result:", result);
    if (!result) {
      return errorResponse("Category not found", 404, "NOT_FOUND");
    }
    return successResponse({
      category: result
    });
  } catch (error) {
    console.error("Get category error:", error);
    return errorResponse("Failed to get category", 500, "SERVER_ERROR");
  }
}
__name(onRequestGet8, "onRequestGet");

// api/photos/[id].ts
async function onRequestGet9(context) {
  try {
    const { request, params, env } = context;
    const user = await optionalAuth(request, env);
    const isAdmin2 = user?.role === "admin";
    const photoId = params.id;
    if (!photoId) {
      return errorResponse("Photo ID is required", 400, "VALIDATION_ERROR");
    }
    let sql = `
      SELECT 
        p.id, p.title, p.description, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at,
        u.email as uploaded_by_email
      FROM photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.id = ?
    `;
    const sqlParams = [photoId];
    if (!isAdmin2) {
      sql += " AND p.is_active = 1";
    }
    const photo = await queryOne(env.DB, sql, sqlParams);
    if (!photo) {
      return errorResponse("Photo not found", 404, "NOT_FOUND");
    }
    const categories = await queryAll(env.DB, `
      SELECT c.id, c.name, c.slug
      FROM categories c
      INNER JOIN photos_categories pc ON c.id = pc.category_id
      WHERE pc.photo_id = ?
      ORDER BY c.name
    `, [photoId]);
    return successResponse({
      photo: {
        ...photo,
        categoryIds: categories.map((c) => c.id),
        categoryNames: categories.map((c) => c.name),
        categorySlugs: categories.map((c) => c.slug)
      }
    });
  } catch (error) {
    console.error("Get photo error:", error);
    return errorResponse(`Failed to get photo: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestGet9, "onRequestGet");
async function onRequestPut3(context) {
  try {
    const { request, params, env } = context;
    await requireAdmin(request, env);
    const photoId = params.id;
    if (!photoId) {
      return errorResponse("Photo ID is required", 400, "VALIDATION_ERROR");
    }
    const body = await parseJsonBody(request);
    const existing = await queryOne(env.DB, "SELECT id FROM photos WHERE id = ?", [photoId]);
    if (!existing) {
      return errorResponse("Photo not found", 404, "NOT_FOUND");
    }
    const updates = [];
    const sqlParams = [];
    if (body.title !== void 0) {
      updates.push("title = ?");
      sqlParams.push(body.title);
    }
    if (body.description !== void 0) {
      updates.push("description = ?");
      sqlParams.push(body.description);
    }
    if (body.price !== void 0) {
      updates.push("price = ?");
      sqlParams.push(body.price);
    }
    if (body.isActive !== void 0) {
      updates.push("is_active = ?");
      sqlParams.push(body.isActive ? 1 : 0);
    }
    if (updates.length === 0 && !body.categoryIds) {
      return errorResponse("No fields to update", 400, "VALIDATION_ERROR");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (updates.length > 0) {
      updates.push("updated_at = ?");
      sqlParams.push(now);
      sqlParams.push(photoId);
      await execute(
        env.DB,
        `UPDATE photos SET ${updates.join(", ")} WHERE id = ?`,
        sqlParams
      );
    }
    if (body.categoryIds !== void 0) {
      if (!body.categoryIds || body.categoryIds.length === 0) {
        return errorResponse("At least one category is required", 400, "VALIDATION_ERROR");
      }
      await execute(env.DB, "DELETE FROM photos_categories WHERE photo_id = ?", [photoId]);
      for (const categoryId of body.categoryIds) {
        await execute(env.DB, `
          INSERT INTO photos_categories (photo_id, category_id, created_at)
          VALUES (?, ?, ?)
        `, [photoId, categoryId, now]);
      }
    }
    const updated = await queryOne(env.DB, `
      SELECT 
        p.id, p.title, p.description, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at
      FROM photos p
      WHERE p.id = ?
    `, [photoId]);
    const categories = await queryAll(env.DB, `
      SELECT c.id, c.name
      FROM categories c
      INNER JOIN photos_categories pc ON c.id = pc.category_id
      WHERE pc.photo_id = ?
    `, [photoId]);
    return successResponse({
      photo: {
        ...updated,
        categoryIds: categories.map((c) => c.id),
        categoryNames: categories.map((c) => c.name)
      }
    });
  } catch (error) {
    console.error("Update photo error:", error);
    return errorResponse(`Failed to update photo: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestPut3, "onRequestPut");

// api/categories/index.ts
async function onRequestGet10(context) {
  try {
    const { env } = context;
    const categories = await getCategories(env.DB, false);
    return successResponse({
      categories
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return errorResponse("Failed to get categories", 500, "SERVER_ERROR");
  }
}
__name(onRequestGet10, "onRequestGet");

// api/health.ts
async function onRequestGet11(context) {
  const { env } = context;
  const healthData = {
    success: true,
    data: {
      status: "healthy",
      environment: env.ENVIRONMENT || "unknown",
      hasJwtSecret: !!env.JWT_SECRET,
      jwtSecretLength: env.JWT_SECRET ? env.JWT_SECRET.length : 0,
      hasDatabase: !!env.DB,
      hasR2: !!env.R2,
      jwtAccessExpiry: env.JWT_ACCESS_EXPIRY || "not set",
      jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY || "not set"
    }
  };
  return new Response(JSON.stringify(healthData), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequestGet11, "onRequestGet");

// api/photos/index.ts
async function onRequestGet12(context) {
  try {
    const { request, env } = context;
    const user = await optionalAuth(request, env);
    const isAdmin2 = user?.role === "admin";
    const params = getQueryParams(request);
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "20");
    const categoryId = params.get("categoryId") || void 0;
    const search = params.get("search") || void 0;
    let sql = `
      SELECT 
        p.id, p.title, p.description, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at
      FROM photos p
      WHERE 1=1
    `;
    const sqlParams = [];
    if (!isAdmin2) {
      sql += " AND p.is_active = 1";
    }
    if (categoryId) {
      sql += ` AND EXISTS (
        SELECT 1 FROM photos_categories pc 
        WHERE pc.photo_id = p.id AND pc.category_id = ?
      )`;
      sqlParams.push(categoryId);
    }
    if (search) {
      sql += " AND (p.title LIKE ? OR p.description LIKE ?)";
      const searchTerm = `%${search}%`;
      sqlParams.push(searchTerm, searchTerm);
    }
    sql += " ORDER BY p.created_at DESC";
    const photos = await query(env.DB, sql, sqlParams);
    const photoIds = photos.map((p) => p.id);
    const categoriesMap = /* @__PURE__ */ new Map();
    if (photoIds.length > 0) {
      const placeholders = photoIds.map(() => "?").join(",");
      const categoriesResult = await query(env.DB, `
        SELECT pc.photo_id, c.id, c.name, c.slug
        FROM photos_categories pc
        INNER JOIN categories c ON pc.category_id = c.id
        WHERE pc.photo_id IN (${placeholders})
        ORDER BY c.name
      `, photoIds);
      for (const cat of categoriesResult) {
        if (!categoriesMap.has(cat.photoId)) {
          categoriesMap.set(cat.photoId, []);
        }
        categoriesMap.get(cat.photoId).push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        });
      }
    }
    const photosWithCategories = photos.map((photo) => ({
      ...photo,
      categoryIds: (categoriesMap.get(photo.id) || []).map((c) => c.id),
      categoryNames: (categoriesMap.get(photo.id) || []).map((c) => c.name),
      categorySlugs: (categoriesMap.get(photo.id) || []).map((c) => c.slug)
    }));
    const paginationResult = paginate(photosWithCategories, page, limit);
    return successResponse({
      photos: paginationResult.items,
      pagination: {
        page: paginationResult.page,
        limit,
        total: paginationResult.total,
        totalPages: paginationResult.pages
      }
    });
  } catch (error) {
    console.error("List photos error:", error);
    return errorResponse(`Failed to list photos: ${error.message}`, 500, "SERVER_ERROR");
  }
}
__name(onRequestGet12, "onRequestGet");

// _middleware.ts
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return context.next();
  }
  if (url.pathname.startsWith("/api/photos/image/")) {
    try {
      const r2Key = url.pathname.substring("/api/photos/image/".length);
      if (!r2Key) {
        const errorResponse2 = new Response(JSON.stringify({ error: "Image path is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
        return addCorsHeaders(errorResponse2);
      }
      console.log("Fetching image from R2:", r2Key);
      const object = await getFromR2(env.R2, r2Key);
      if (!object) {
        console.error("Image not found in R2:", r2Key);
        const notFoundResponse = new Response(JSON.stringify({ error: "Image not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
        return addCorsHeaders(notFoundResponse);
      }
      const headers = new Headers();
      headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      if (object.httpEtag) {
        headers.set("ETag", object.httpEtag);
      }
      const imageResponse = new Response(object.body, { headers });
      return addCorsHeaders(imageResponse);
    } catch (error) {
      console.error("Serve image error:", error);
      const errorResponse2 = new Response(JSON.stringify({ error: `Failed to serve image: ${error.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
      return addCorsHeaders(errorResponse2);
    }
  }
  if (request.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }
  if (env.ENVIRONMENT === "development") {
    console.log(`${request.method} ${url.pathname}`);
  }
  try {
    const response = await context.next();
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Global middleware error:", error);
    const errorResponse2 = new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "An unexpected error occurred",
          code: "SERVER_ERROR"
        }
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      }
    );
    return errorResponse2;
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-rCRbTU/functionsRoutes-0.5642336593077444.mjs
var routes = [
  {
    routePath: "/api/fulfillment/orders/:id",
    mountPath: "/api/fulfillment/orders",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/categories/:id/delete",
    mountPath: "/api/categories/:id",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/categories/:id/update",
    mountPath: "/api/categories/:id",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/photos/:id/delete",
    mountPath: "/api/photos/:id",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/photos/:id/update",
    mountPath: "/api/photos/:id",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut2]
  },
  {
    routePath: "/api/analytics/stats",
    mountPath: "/api/analytics",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/analytics/stats",
    mountPath: "/api/analytics",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/auth/refresh",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/auth/register",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/cart/calculate",
    mountPath: "/api/cart",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/categories/create",
    mountPath: "/api/categories",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/categories/upload-image",
    mountPath: "/api/categories",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/fulfillment/calculate",
    mountPath: "/api/fulfillment",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/fulfillment/items",
    mountPath: "/api/fulfillment",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/fulfillment/orders",
    mountPath: "/api/fulfillment",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/fulfillment/orders",
    mountPath: "/api/fulfillment",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/photos/image",
    mountPath: "/api/photos",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/photos/upload",
    mountPath: "/api/photos",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/products/pricing",
    mountPath: "/api/products",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/categories/:id",
    mountPath: "/api/categories",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/photos/:id",
    mountPath: "/api/photos",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/photos/:id",
    mountPath: "/api/photos",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut3]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api/categories",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/photos",
    mountPath: "/api/photos",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
