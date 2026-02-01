# Testing Authentication API

## Prerequisites

1. **Set up the database:**
```bash
npm run db:migrate:local
npm run db:seed:local
```

2. **Create `.dev.vars` file:**
```bash
cp .dev.vars.example .dev.vars
```

3. **Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.dev.vars`:
```
JWT_SECRET=<your-generated-secret>
```

4. **Build and start dev server:**
```bash
npm run build
npm run dev
```

Server will run at `http://localhost:8788`

---

## API Endpoints

### 1. Register New User

**Request:**
```bash
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "customer"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Error Cases:**
```bash
# Missing password
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Weak password
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "weak"}'

# Invalid email
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail", "password": "Test1234"}'

# Duplicate email
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234"}'
```

---

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "customer"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Login with Admin (seeded user):**
```bash
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@adrianphotos.com",
    "password": "Admin123!"
  }'
```

**Error Cases:**
```bash
# Wrong password
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "WrongPass1"}'

# Non-existent user
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nobody@example.com", "password": "Test1234"}'
```

---

### 3. Get Current User

**Request:**
```bash
# Replace YOUR_ACCESS_TOKEN with token from login/register
curl -X GET http://localhost:8788/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "customer",
      "createdAt": "2026-02-01T19:30:00.000Z"
    }
  }
}
```

**Error Cases:**
```bash
# No token
curl -X GET http://localhost:8788/api/auth/me

# Invalid token
curl -X GET http://localhost:8788/api/auth/me \
  -H "Authorization: Bearer invalid-token"
```

---

### 4. Refresh Token

**Request:**
```bash
# Replace YOUR_REFRESH_TOKEN with token from login/register
curl -X POST http://localhost:8788/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Note:** Old refresh token is invalidated after successful refresh (token rotation).

---

### 5. Logout

**Request:**
```bash
# Replace YOUR_REFRESH_TOKEN with token from login
curl -X POST http://localhost:8788/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Complete Authentication Flow

```bash
# 1. Register new user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"flow@example.com","password":"Flow1234","firstName":"Flow","lastName":"Test"}')

echo "Register: $REGISTER_RESPONSE"

# 2. Extract access token (you'll need jq for this, or do it manually)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.refreshToken')

echo "Access Token: $ACCESS_TOKEN"

# 3. Get current user
curl -X GET http://localhost:8788/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Refresh tokens
NEW_TOKENS=$(curl -s -X POST http://localhost:8788/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

echo "New tokens: $NEW_TOKENS"

# 5. Logout
curl -X POST http://localhost:8788/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

---

## Testing Checklist

### Registration
- [ ] Register with valid email and password
- [ ] Reject weak password (< 8 chars)
- [ ] Reject password without uppercase
- [ ] Reject password without lowercase
- [ ] Reject password without number
- [ ] Reject invalid email format
- [ ] Reject duplicate email
- [ ] Return user object and tokens on success

### Login
- [ ] Login with valid credentials
- [ ] Reject wrong password
- [ ] Reject non-existent user
- [ ] Return user object and tokens on success
- [ ] Admin login works with seeded account

### Token Management
- [ ] Access token contains correct user data
- [ ] Refresh token rotation works
- [ ] Old refresh token invalid after refresh
- [ ] Expired refresh token rejected
- [ ] Invalid refresh token rejected
- [ ] Deleted refresh token rejected

### Authorization
- [ ] Protected endpoint (/api/auth/me) requires token
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] Valid token allows access

### Logout
- [ ] Logout invalidates refresh token
- [ ] Subsequent refresh with old token fails
- [ ] Logout always returns success (even if token invalid)

---

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Valid passwords:** `Test1234`, `MyPass99`, `Admin123!`
**Invalid passwords:** `test`, `PASSWORD`, `noNumbers`, `short1`

---

## Additional Endpoints for Testing

### Get Categories
```bash
curl -X GET http://localhost:8788/api/categories
```

### Get Product Pricing
```bash
curl -X GET http://localhost:8788/api/products/pricing
```

These endpoints are public (no auth required) and should return seeded data.

---

## Troubleshooting

### "Invalid JSON body"
- Make sure you're sending `Content-Type: application/json` header
- Check JSON syntax is valid

### "Database query failed"
- Make sure you ran migrations: `npm run db:migrate:local`
- Make sure you ran seed data: `npm run db:seed:local`

### "Invalid token"
- Token may be expired (access tokens expire in 15 minutes)
- Try logging in again to get a fresh token
- Check JWT_SECRET is set in .dev.vars

### Server not responding
- Make sure you built the frontend: `npm run build`
- Check server is running on port 8788
- Look for errors in terminal output

---

## Next Steps

Once authentication is working:
1. Test frontend integration (Angular auth service)
2. Implement auth guards for protected routes
3. Add HTTP interceptor for automatic token refresh
4. Build photo management endpoints
5. Add shopping cart functionality
