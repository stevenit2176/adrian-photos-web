# Backend Infrastructure (MVP)

## Overview
Cloudflare Pages Functions for serverless backend API.

## Project Structure

```
functions/
├── api/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   ├── refresh.ts
│   │   └── logout.ts
│   ├── photos/
│   │   ├── index.ts          # GET /api/photos
│   │   ├── [id].ts           # GET /api/photos/:id
│   │   ├── upload.ts         # POST /api/photos/upload
│   │   └── [id]/delete.ts    # DELETE /api/photos/:id
│   ├── categories/
│   │   ├── index.ts          # GET /api/categories
│   │   └── [id].ts           # GET/PUT/DELETE /api/categories/:id
│   ├── cart/
│   │   └── calculate.ts      # POST /api/cart/calculate
│   ├── checkout/
│   │   ├── create-session.ts # POST /api/checkout/create-session
│   │   ├── webhook.ts        # POST /api/checkout/webhook
│   │   └── session/[id].ts   # GET /api/checkout/session/:id
│   ├── fulfillment/
│   │   ├── submit-order.ts   # POST /api/fulfillment/submit-order
│   │   └── webhook.ts        # POST /api/fulfillment/webhook
│   ├── orders/
│   │   ├── index.ts          # GET /api/orders
│   │   └── [id].ts           # GET /api/orders/:id
│   ├── admin/
│   │   ├── stats.ts          # GET /api/admin/stats
│   │   └── orders.ts         # GET /api/admin/orders
│   └── products/
│       └── pricing.ts        # GET /api/products/pricing
├── lib/
│   ├── db.ts                 # D1 database helpers
│   ├── auth.ts               # JWT and password helpers
│   ├── r2.ts                 # R2 storage helpers
│   ├── stripe.ts             # Stripe integration
│   ├── bay-photo.ts          # Bay Photo integration
│   ├── middleware.ts         # Auth middleware
│   ├── validation.ts         # Input validation
│   └── utils.ts              # Common utilities
└── _middleware.ts            # Global CORS and error handling
```

## Cloudflare Bindings

### D1 Database
```toml
[[d1_databases]]
binding = "DB"
database_name = "adrian-photos-db"
database_id = "xxx"
```

### R2 Storage
```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "adrian-photos"
```

### Environment Variables
```toml
[vars]
JWT_SECRET = "xxx"
STRIPE_PUBLISHABLE_KEY = "pk_test_xxx"

# Secrets (set via CLI)
# wrangler secret put STRIPE_SECRET_KEY
# wrangler secret put STRIPE_WEBHOOK_SECRET
# wrangler secret put BAYPHOTO_API_KEY
```

## Implementation Tasks

### Configuration
- [ ] Create `wrangler.toml`
  - [ ] Configure D1 binding
  - [ ] Configure R2 binding
  - [ ] Set environment variables
  - [ ] Configure routes
- [ ] Create D1 database via CLI
  - [ ] `wrangler d1 create adrian-photos-db`
  - [ ] Update wrangler.toml with database_id
- [ ] Create R2 bucket via CLI
  - [ ] `wrangler r2 bucket create adrian-photos`

### Core Libraries
- [ ] Create `functions/lib/db.ts`
  - [ ] getDb(env) helper
  - [ ] query() helper with error handling
  - [ ] transaction() helper
  - [ ] Common queries (getUserById, etc.)
- [ ] Create `functions/lib/auth.ts`
  - [ ] generateAccessToken()
  - [ ] generateRefreshToken()
  - [ ] verifyAccessToken()
  - [ ] hashPassword()
  - [ ] comparePassword()
- [ ] Create `functions/lib/middleware.ts`
  - [ ] requireAuth() - extract and verify JWT
  - [ ] requireAdmin() - check admin role
  - [ ] CORS headers
  - [ ] Error handling wrapper
- [ ] Create `functions/lib/validation.ts`
  - [ ] validateEmail()
  - [ ] validatePassword()
  - [ ] validateRequired()
  - [ ] sanitizeInput()
- [ ] Create `functions/lib/utils.ts`
  - [ ] generateId() - UUID generation
  - [ ] formatPrice()
  - [ ] formatDate()
  - [ ] errorResponse()
  - [ ] successResponse()
- [ ] Create `functions/_middleware.ts`
  - [ ] CORS handling
  - [ ] Global error handler
  - [ ] Request logging (development)

### Dependencies
- [ ] Install packages:
  ```bash
  npm install --save
    @cloudflare/workers-types
    bcryptjs
    jsonwebtoken
    nanoid
    stripe
    @types/bcryptjs
    @types/jsonwebtoken
  ```

## API Response Format

### Success Response
```typescript
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```typescript
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "details": { ... } // optional
  }
}
```

## Error Codes
- `AUTH_REQUIRED` - 401: No token provided
- `AUTH_INVALID` - 401: Invalid token
- `AUTH_EXPIRED` - 401: Token expired
- `FORBIDDEN` - 403: No permission
- `NOT_FOUND` - 404: Resource not found
- `VALIDATION_ERROR` - 400: Invalid input
- `SERVER_ERROR` - 500: Internal error

## Middleware Pattern

```typescript
// functions/lib/middleware.ts
export async function requireAuth(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('AUTH_REQUIRED');
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token, env.JWT_SECRET);
  
  return payload; // { userId, role }
}
```

## Function Example

```typescript
// functions/api/photos/[id].ts
import { requireAuth } from '../../lib/middleware';
import { getDb } from '../../lib/db';
import { errorResponse, successResponse } from '../../lib/utils';

export async function onRequestGet(context) {
  try {
    const { params, env } = context;
    const db = getDb(env);
    
    const photo = await db.prepare(
      'SELECT * FROM photos WHERE id = ? AND is_active = 1'
    ).bind(params.id).first();
    
    if (!photo) {
      return errorResponse('Photo not found', 404, 'NOT_FOUND');
    }
    
    return successResponse(photo);
  } catch (error) {
    return errorResponse(error.message, 500, 'SERVER_ERROR');
  }
}

export async function onRequestDelete(context) {
  try {
    const user = await requireAuth(context.request, context.env);
    if (user.role !== 'admin') {
      return errorResponse('Admin access required', 403, 'FORBIDDEN');
    }
    
    // Delete logic...
    
    return successResponse({ message: 'Photo deleted' });
  } catch (error) {
    if (error.message === 'AUTH_REQUIRED') {
      return errorResponse('Authentication required', 401, 'AUTH_REQUIRED');
    }
    return errorResponse(error.message, 500, 'SERVER_ERROR');
  }
}
```

## Database Helper Example

```typescript
// functions/lib/db.ts
export function getDb(env: Env) {
  return env.DB;
}

export async function getUserById(db: D1Database, userId: string) {
  return await db.prepare(
    'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?'
  ).bind(userId).first();
}

export async function createUser(db: D1Database, userData: any) {
  const { id, email, passwordHash, firstName, lastName } = userData;
  
  await db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, email, passwordHash, firstName, lastName).run();
  
  return getUserById(db, id);
}
```

## CORS Configuration

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  const response = await context.next();
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

## Local Development

```bash
# Install dependencies
npm install

# Run D1 migrations locally
wrangler d1 execute adrian-photos-db --local --file=./migrations/0001_initial_schema.sql

# Start local dev server
npm run dev

# Test API endpoint
curl http://localhost:8788/api/photos
```

## Deployment

```bash
# Run migrations on production D1
wrangler d1 execute adrian-photos-db --file=./migrations/0001_initial_schema.sql

# Set secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put BAYPHOTO_API_KEY

# Deploy (automatic with git push)
git push origin main
```

## Testing Checklist
- [ ] All API endpoints respond correctly
- [ ] Authentication middleware works
- [ ] Admin middleware blocks non-admins
- [ ] CORS headers present
- [ ] Error handling consistent
- [ ] D1 queries execute successfully
- [ ] R2 file operations work
- [ ] Environment variables loaded
- [ ] Secrets accessible in functions
- [ ] Local development working
