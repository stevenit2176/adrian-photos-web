# Authentication Architecture (MVP)

## Overview
JWT-based authentication with access/refresh token pattern.

## Authentication Flow
1. User registers or logs in with email/password
2. Server validates credentials, returns access token (15min) + refresh token (7 days)
3. Client stores tokens (localStorage for access, httpOnly cookie for refresh)
4. Client includes access token in Authorization header for API calls
5. When access token expires, use refresh token to get new access token
6. On logout, invalidate refresh token

## Security Features
- Password hashing with bcrypt (10 rounds)
- JWT tokens signed with secret
- Refresh token rotation
- HTTPS only (Cloudflare provides SSL)
- CORS configuration

## Backend Implementation

### Libraries Needed
```typescript
// functions/lib/auth.ts
- bcrypt (password hashing)
- jsonwebtoken (JWT creation/verification)
- nanoid (ID generation)
```

### API Endpoints (4 core endpoints)

#### 1. POST /api/auth/register
```typescript
Request: { email, password, firstName?, lastName? }
Response: { user, accessToken, refreshToken }
```

#### 2. POST /api/auth/login
```typescript
Request: { email, password }
Response: { user, accessToken, refreshToken }
```

#### 3. POST /api/auth/refresh
```typescript
Request: { refreshToken }
Response: { accessToken, refreshToken }
```

#### 4. POST /api/auth/logout
```typescript
Request: { refreshToken }
Response: { message: "Logged out" }
```

### Middleware
```typescript
// functions/lib/middleware.ts
- requireAuth() - verify JWT and attach user to request
- requireAdmin() - verify user has admin role
```

## Frontend Implementation

### Auth Service
```typescript
// src/app/services/auth.service.ts
- register(email, password, firstName, lastName)
- login(email, password)
- logout()
- refreshToken()
- getCurrentUser()
- isAuthenticated()
- isAdmin()
```

### Auth Guard
```typescript
// src/app/guards/auth.guard.ts
- Protect authenticated routes
- Redirect to login if not authenticated
```

### Admin Guard
```typescript
// src/app/guards/admin.guard.ts
- Protect admin routes
- Redirect to home if not admin
```

### Components
```typescript
// src/app/auth/login/
// src/app/auth/register/
```

## Implementation Tasks

### Backend
- [ ] Install dependencies: bcrypt, jsonwebtoken, nanoid
- [ ] Create `functions/lib/auth.ts`
  - [ ] generateAccessToken(userId, role)
  - [ ] generateRefreshToken(userId)
  - [ ] verifyAccessToken(token)
  - [ ] hashPassword(password)
  - [ ] comparePassword(password, hash)
- [ ] Create `functions/lib/middleware.ts`
  - [ ] requireAuth() middleware
  - [ ] requireAdmin() middleware
- [ ] Create `functions/api/auth/register.ts`
- [ ] Create `functions/api/auth/login.ts`
- [ ] Create `functions/api/auth/refresh.ts`
- [ ] Create `functions/api/auth/logout.ts`
- [ ] Set up JWT_SECRET in environment variables

### Frontend
- [ ] Create `src/app/services/auth.service.ts`
- [ ] Create `src/app/guards/auth.guard.ts`
- [ ] Create `src/app/guards/admin.guard.ts`
- [ ] Create `src/app/auth/login/login.component.ts`
- [ ] Create `src/app/auth/register/register.component.ts`
- [ ] Add auth routes to app.routes.ts
- [ ] Create auth interceptor for adding JWT to requests
- [ ] Handle token refresh on 401 responses

## Environment Variables
```
JWT_SECRET=<random-secret-key>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## Testing Checklist
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected route with valid token
- [ ] Access protected route with expired token
- [ ] Refresh token flow
- [ ] Logout and verify token invalidation
- [ ] Admin-only route protection
