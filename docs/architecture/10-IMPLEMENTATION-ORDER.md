# MVP Implementation Order

## Phase 1: Foundation (Week 1)
**Goal**: Set up backend infrastructure and database

### 1.1 Database Setup
- [ ] Create wrangler.toml configuration
- [ ] Create D1 database
- [ ] Write migration file: 0001_initial_schema.sql
- [ ] Write seed file: 0002_seed_data.sql
- [ ] Run migrations locally
- [ ] Test database queries

### 1.2 Backend Core Libraries
- [ ] Install dependencies (bcrypt, jwt, nanoid, stripe)
- [ ] Create functions/lib/db.ts
- [ ] Create functions/lib/auth.ts
- [ ] Create functions/lib/middleware.ts
- [ ] Create functions/lib/validation.ts
- [ ] Create functions/lib/utils.ts
- [ ] Create functions/_middleware.ts (CORS)
- [ ] Test all library functions

### 1.3 Environment Setup
- [ ] Configure environment variables in wrangler.toml
- [ ] Set up secrets (JWT_SECRET locally)
- [ ] Create .env.example file
- [ ] Update README with setup instructions

**Milestone**: Backend infrastructure ready, database operational

---

## Phase 2: Authentication (Week 1-2)
**Goal**: User registration and login working

### 2.1 Backend Auth API
- [ ] Create functions/api/auth/register.ts
- [ ] Create functions/api/auth/login.ts
- [ ] Create functions/api/auth/refresh.ts
- [ ] Create functions/api/auth/logout.ts
- [ ] Test all endpoints with Postman/curl

### 2.2 Frontend Auth
- [ ] Create src/app/services/auth.service.ts
- [ ] Create src/app/guards/auth.guard.ts
- [ ] Create src/app/guards/admin.guard.ts
- [ ] Create src/app/auth/login component
- [ ] Create src/app/auth/register component
- [ ] Add auth routes to app.routes.ts
- [ ] Create HTTP interceptor for JWT
- [ ] Test login/register flows

**Milestone**: Users can register and login

---

## Phase 3: Photo Management (Week 2)
**Goal**: Admin can upload photos, users can view them

### 3.1 R2 Storage Setup
- [ ] Create R2 bucket
- [ ] Create functions/lib/r2.ts
- [ ] Test file upload/download/delete

### 3.2 Backend Photo API
- [ ] Create functions/api/photos/index.ts (list)
- [ ] Create functions/api/photos/[id].ts (get single)
- [ ] Create functions/api/photos/upload.ts (admin)
- [ ] Create functions/api/photos/[id]/delete.ts (admin)
- [ ] Create functions/api/categories/index.ts
- [ ] Test all endpoints

### 3.3 Frontend Photo Components
- [ ] Create src/app/services/photo.service.ts
- [ ] Update gallery component to load from API
- [ ] Create photo-detail component
- [ ] Create admin/photos/photo-upload component
- [ ] Create admin/photos/photo-list component
- [ ] Test photo upload and viewing

**Milestone**: Photos can be uploaded and displayed

---

## Phase 4: Products & Shopping Cart (Week 2-3)
**Goal**: Users can select products and add to cart

### 4.1 Product Setup
- [ ] Seed product types and sizes in database
- [ ] Create functions/api/products/pricing.ts
- [ ] Test product endpoints

### 4.2 Shopping Cart
- [ ] Create src/app/services/cart.service.ts
- [ ] Create src/app/models/cart.model.ts
- [ ] Create cart component
- [ ] Create cart-icon component
- [ ] Update photo-detail with product selection
- [ ] Test cart operations (add/update/remove)

### 4.3 Cart Calculation
- [ ] Create functions/api/cart/calculate.ts
- [ ] Implement tax/shipping calculation
- [ ] Test cart totals

**Milestone**: Shopping cart functional

---

## Phase 5: Checkout & Stripe (Week 3)
**Goal**: Users can complete purchases

### 5.1 Stripe Setup
- [ ] Create Stripe account (test mode)
- [ ] Get API keys
- [ ] Install Stripe SDK
- [ ] Create functions/lib/stripe.ts

### 5.2 Checkout Flow
- [ ] Create functions/api/checkout/create-session.ts
- [ ] Create functions/api/checkout/webhook.ts
- [ ] Set up Stripe webhook endpoint
- [ ] Test checkout session creation

### 5.3 Frontend Checkout
- [ ] Create src/app/services/checkout.service.ts
- [ ] Create checkout component (shipping form)
- [ ] Create checkout/success component
- [ ] Create checkout/cancel component
- [ ] Test complete checkout flow
- [ ] Test webhook handling

**Milestone**: Users can purchase prints with Stripe

---

## Phase 6: Bay Photo Integration (Week 3-4)
**Goal**: Orders automatically sent to Bay Photo

### 6.1 Bay Photo Setup
- [ ] Create Bay Photo account
- [ ] Get API credentials
- [ ] Map product codes
- [ ] Update database with Bay Photo codes

### 6.2 Fulfillment Integration
- [ ] Create functions/lib/bay-photo.ts
- [ ] Create functions/api/fulfillment/submit-order.ts
- [ ] Create functions/api/fulfillment/webhook.ts
- [ ] Update Stripe webhook to trigger fulfillment
- [ ] Test order submission
- [ ] Test status updates

**Milestone**: Orders automatically fulfilled via Bay Photo

---

## Phase 7: Admin Dashboard (Week 4)
**Goal**: Admin can manage site

### 7.1 Admin Layout
- [ ] Create admin layout component
- [ ] Create admin sidebar
- [ ] Create admin routes
- [ ] Test navigation

### 7.2 Admin Features
- [ ] Create admin dashboard (stats)
- [ ] Create admin/orders/order-list component
- [ ] Create admin/orders/order-detail component
- [ ] Create admin/categories management
- [ ] Create functions/api/admin/stats.ts
- [ ] Create functions/api/admin/orders.ts
- [ ] Test all admin features

**Milestone**: Admin dashboard operational

---

## Phase 8: Polish & Testing (Week 4-5)
**Goal**: Production-ready MVP

### 8.1 Error Handling
- [ ] Add error boundaries
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Add empty states

### 8.2 Testing
- [ ] Test all user flows
- [ ] Test all admin flows
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

### 8.3 Production Deployment
- [ ] Run migrations on production D1
- [ ] Set production secrets
- [ ] Configure production Stripe
- [ ] Configure production Bay Photo
- [ ] Deploy to Cloudflare Pages
- [ ] Test production environment

### 8.4 Documentation
- [ ] Update README
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Create admin guide

**Milestone**: MVP deployed to production

---

## Success Criteria

### Functional Requirements
- ✅ Users can browse photos by category
- ✅ Users can create account and login
- ✅ Users can view photo details
- ✅ Users can add prints to cart
- ✅ Users can checkout with Stripe
- ✅ Orders are stored in database
- ✅ Orders are sent to Bay Photo
- ✅ Admin can upload photos
- ✅ Admin can view orders
- ✅ Admin can manage categories

### Technical Requirements
- ✅ Angular 21 frontend
- ✅ Cloudflare Pages Functions backend
- ✅ D1 database operational
- ✅ R2 storage working
- ✅ Stripe integration complete
- ✅ Bay Photo integration complete
- ✅ Authentication secure (JWT)
- ✅ Mobile responsive
- ✅ Production deployed

### Performance Requirements
- Page load < 3 seconds
- Image loading optimized
- API responses < 500ms
- Checkout flow smooth

---

## Post-MVP Features (Future)
- Email notifications (Resend)
- Order tracking for customers
- User favorites/wishlists
- Photo galleries (collections)
- Discount codes
- Multiple shipping addresses
- Product reviews
- Advanced analytics
- Blog/content pages
- SEO optimization
- Email marketing integration
