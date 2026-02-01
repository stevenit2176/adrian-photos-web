# Phase 2 Complete: Authentication API ✅

## What We Built

### Authentication Endpoints (functions/api/auth/)

**1. POST /api/auth/register**
- Validates email format and password strength
- Checks for duplicate emails
- Hashes password using Web Crypto API
- Creates user in database
- Generates JWT access + refresh tokens
- Returns user data and tokens

**2. POST /api/auth/login**
- Validates credentials
- Verifies password hash
- Generates new JWT tokens
- Returns user data and tokens
- Works with seeded admin account

**3. POST /api/auth/refresh**
- Validates refresh token
- Implements token rotation (old token invalidated)
- Checks token expiration
- Generates new access + refresh tokens
- Cleans up expired/invalid tokens

**4. POST /api/auth/logout**
- Invalidates refresh token in database
- Graceful handling (always returns success)

**5. GET /api/auth/me**
- Protected endpoint (requires authentication)
- Returns current user information
- Uses requireAuth() middleware

### Support Endpoints

**6. GET /api/categories**
- Public endpoint
- Returns all active categories
- Uses seeded data

**7. GET /api/products/pricing**
- Public endpoint
- Returns all product types with sizes and pricing
- Nested structure (types → sizes)

## Key Features

### Security
- ✅ Password strength validation (8+ chars, uppercase, lowercase, number)
- ✅ Email format validation
- ✅ Password hashing with Web Crypto API (SHA-256)
- ✅ JWT tokens with configurable expiry
- ✅ Refresh token rotation (prevents reuse)
- ✅ Token storage in database (allows invalidation)
- ✅ Protected endpoints with middleware

### Clean Code Principles
- ✅ DRY - Reuses auth.ts, db.ts, validation.ts utilities
- ✅ Single Responsibility - Each endpoint does one thing
- ✅ Consistent error handling with custom error classes
- ✅ Standardized response format
- ✅ Proper TypeScript typing
- ✅ Comprehensive error messages

### Token Management
- ✅ Access tokens: 15 minutes (configurable via env)
- ✅ Refresh tokens: 7 days (configurable via env)
- ✅ Automatic expiration checking
- ✅ Token rotation on refresh
- ✅ Database cleanup of invalid tokens

## Project Structure Now

```
functions/
├── api/
│   ├── auth/
│   │   ├── register.ts ✅
│   │   ├── login.ts ✅
│   │   ├── refresh.ts ✅
│   │   ├── logout.ts ✅
│   │   └── me.ts ✅
│   ├── categories/
│   │   └── index.ts ✅
│   └── products/
│       └── pricing.ts ✅
├── lib/
│   ├── types.ts ✅
│   ├── utils.ts ✅
│   ├── validation.ts ✅
│   ├── db.ts ✅
│   ├── auth.ts ✅
│   └── middleware.ts ✅
└── _middleware.ts ✅
```

## Testing

Created comprehensive testing guide: **[TEST_AUTH_API.md](TEST_AUTH_API.md)**

### Complete Test Flow
```bash
# 1. Register user
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 2. Login
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 3. Get current user (with token)
curl -X GET http://localhost:8788/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Refresh tokens
curl -X POST http://localhost:8788/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# 5. Logout
curl -X POST http://localhost:8788/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Seeded Admin Account
```
Email: admin@adrianphotos.com
Password: Admin123!
Role: admin
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` (400) - Invalid input
- `AUTH_REQUIRED` (401) - No token provided
- `AUTH_INVALID` (401) - Invalid/expired token
- `NOT_FOUND` (404) - Resource not found
- `SERVER_ERROR` (500) - Server error

## Password Requirements

Enforced by validation.ts:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Valid examples:** `Test1234`, `MyPass99`, `Admin123!`
**Invalid examples:** `test`, `PASSWORD`, `noNumbers`, `short1`

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### User Object (never includes password)
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer",
  "createdAt": "2026-02-01T19:30:00.000Z"
}
```

## Token Flow

```
┌─────────────────────────────────────────────────────────┐
│                  JWT Token Lifecycle                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Login/Register                                          │
│       │                                                  │
│       ├─> Generate Access Token (15min)                 │
│       ├─> Generate Refresh Token (7 days)               │
│       └─> Store Refresh Token in DB                     │
│                                                          │
│  API Request                                             │
│       │                                                  │
│       ├─> Include Access Token in Authorization header  │
│       ├─> Middleware verifies token                     │
│       └─> Extract user from token payload               │
│                                                          │
│  Token Expires                                           │
│       │                                                  │
│       ├─> Client detects 401 error                      │
│       ├─> Send Refresh Token to /auth/refresh           │
│       ├─> Delete old Refresh Token from DB              │
│       ├─> Generate new Access + Refresh Tokens          │
│       └─> Store new Refresh Token in DB                 │
│                                                          │
│  Logout                                                  │
│       │                                                  │
│       ├─> Send Refresh Token to /auth/logout            │
│       ├─> Delete Refresh Token from DB                  │
│       └─> Client clears all tokens                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Next Steps: Frontend Auth System

Ready to build the Angular authentication layer:

1. **Auth Service** (src/app/services/auth.service.ts)
   - register(), login(), logout()
   - Token storage and management
   - Auto-refresh logic
   - Current user observable

2. **Auth Guards** (src/app/guards/)
   - AuthGuard - protect routes requiring login
   - AdminGuard - protect admin-only routes

3. **HTTP Interceptor** (src/app/interceptors/auth.interceptor.ts)
   - Auto-attach JWT to requests
   - Handle 401 responses
   - Auto-refresh expired tokens

4. **Auth Components** (src/app/auth/)
   - Login component with form
   - Register component with validation
   - Password strength indicator

See [architecture/02-AUTHENTICATION.md](architecture/02-AUTHENTICATION.md) for frontend implementation details.

## To Test Authentication

```bash
# 1. Make sure database is set up
npm run db:migrate:local
npm run db:seed:local

# 2. Create .dev.vars with JWT secret
cp .dev.vars.example .dev.vars
# Add JWT_SECRET=<random-32-byte-hex>

# 3. Build frontend
npm run build

# 4. Start dev server
npm run dev

# 5. Test endpoints (see TEST_AUTH_API.md)
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

See **[TEST_AUTH_API.md](TEST_AUTH_API.md)** for complete testing guide with all endpoints!
