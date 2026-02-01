var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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
  const sql = includeInactive ? `SELECT * FROM categories ORDER BY display_order, name` : `SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name`;
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
var ValidationError = class extends Error {
  details;
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
};
__name(ValidationError, "ValidationError");

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
    return errorResponse("Login failed", 500, "SERVER_ERROR");
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
async function onRequestGet(context) {
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
__name(onRequestGet, "onRequestGet");

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

// api/products/pricing.ts
async function onRequestGet2(context) {
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
__name(onRequestGet2, "onRequestGet");

// api/categories/index.ts
async function onRequestGet3(context) {
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
__name(onRequestGet3, "onRequestGet");

// _middleware.ts
async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return handleCorsPreflightRequest();
  }
  if (context.env.ENVIRONMENT === "development") {
    console.log(`${request.method} ${new URL(request.url).pathname}`);
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

// ../.wrangler/tmp/pages-uFF261/functionsRoutes-0.027493627559141975.mjs
var routes = [
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
    modules: [onRequestGet]
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
    routePath: "/api/products/pricing",
    mountPath: "/api/products",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api/categories",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
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
