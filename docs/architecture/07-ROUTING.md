# Routing Architecture (MVP)

## Overview
Angular routing configuration for public site, authentication, and admin areas.

## Route Structure

### Public Routes
```
/ -> Home (Gallery)
/photos/:id -> Photo Detail
/cart -> Shopping Cart
/checkout -> Checkout (requires auth)
/checkout/success -> Order Success
/checkout/cancel -> Payment Cancelled
/categories/:slug -> Category Gallery
/about -> About Page (future)
/contact -> Contact Page (future)
```

### Auth Routes
```
/login -> Login
/register -> Register
/logout -> Logout (auto-redirect)
```

### Admin Routes (Protected)
```
/admin -> Admin Dashboard
/admin/photos -> Photo Management
/admin/photos/upload -> Upload Photos
/admin/categories -> Category Management
/admin/orders -> Order List
/admin/orders/:id -> Order Detail
/admin/products -> Product/Pricing Management
```

### Error Routes
```
/404 -> Not Found
/403 -> Unauthorized
```

## Route Guards

### AuthGuard
- Protects: `/checkout`, `/admin/**`
- Redirects to: `/login` if not authenticated
- Stores intended URL for post-login redirect

### AdminGuard
- Protects: `/admin/**`
- Redirects to: `/` if not admin role
- Requires: AuthGuard + role check

### GuestGuard (Optional)
- Protects: `/login`, `/register`
- Redirects to: `/` if already authenticated
- Prevents logged-in users from seeing login page

## Implementation Tasks

### Route Configuration
- [ ] Update `src/app/app.routes.ts` with all routes
- [ ] Configure lazy loading for feature modules
- [ ] Set up route guards
- [ ] Configure redirects and fallback routes

### Guards
- [ ] Create `src/app/guards/auth.guard.ts`
  - [ ] Check authentication status
  - [ ] Store return URL
  - [ ] Redirect to login
- [ ] Create `src/app/guards/admin.guard.ts`
  - [ ] Check admin role
  - [ ] Redirect to home if not admin
- [ ] Create `src/app/guards/guest.guard.ts` (optional)
  - [ ] Redirect authenticated users away from login

### Navigation
- [ ] Update navbar with route links
- [ ] Add active route highlighting
- [ ] Add user menu (login/logout/profile)
- [ ] Add admin menu for admin users
- [ ] Implement breadcrumbs (optional)

### Error Pages
- [ ] Create `src/app/pages/not-found/not-found.component.ts`
- [ ] Create `src/app/pages/unauthorized/unauthorized.component.ts`
- [ ] Configure wildcard route for 404

## Route Configuration Example

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./gallery/gallery.component')
      .then(m => m.GalleryComponent)
  },
  {
    path: 'photos/:id',
    loadComponent: () => import('./photo-detail/photo-detail.component')
      .then(m => m.PhotoDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.component')
      .then(m => m.CartComponent)
  },
  
  // Auth routes
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  
  // Protected routes
  {
    path: 'checkout',
    canActivate: [AuthGuard],
    loadComponent: () => import('./checkout/checkout.component')
      .then(m => m.CheckoutComponent)
  },
  
  // Admin routes
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.adminRoutes)
  },
  
  // Error routes
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];
```

## Navigation Menu

### Public Navbar
- Logo (links to home)
- Shop (dropdown: All, Categories)
- Cart (with badge count)
- Login/Register (if not authenticated)
- My Account (if authenticated)
- Admin (if admin role)

### Admin Sidebar
- Dashboard
- Photos
- Categories
- Orders
- Products
- Settings
- Logout

## URL Strategy
- **HTML5 Mode**: Use PathLocationStrategy (default)
- **Base href**: Set in index.html
- **Clean URLs**: No hash (#) in URLs
- **Server config**: Configure redirects for SPA routing (already done for Cloudflare)

## Route Data & Metadata

```typescript
{
  path: 'admin/photos',
  canActivate: [AuthGuard, AdminGuard],
  loadComponent: () => import('...'),
  data: {
    title: 'Photo Management',
    breadcrumb: 'Photos',
    requiresAdmin: true
  }
}
```

## Testing Checklist
- [ ] Navigate to all public routes
- [ ] Test route guards (auth required)
- [ ] Test admin guard (admin only)
- [ ] Test 404 handling
- [ ] Test deep linking (direct URL access)
- [ ] Test back/forward navigation
- [ ] Test lazy loading (check network tab)
- [ ] Test route parameters (photo ID, etc.)
- [ ] Test query parameters (category filter)
- [ ] Test redirect after login
- [ ] Test active route highlighting
- [ ] Test breadcrumbs (if implemented)

## SEO Considerations (Future)
- Server-side rendering (Angular Universal)
- Meta tags per route
- Canonical URLs
- Sitemap generation
- Open Graph tags for photo sharing
