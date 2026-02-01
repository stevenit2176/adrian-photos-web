# Admin Dashboard Architecture (MVP)

## Overview
Basic admin interface for managing photos, viewing orders, and basic site administration.

## Dashboard Sections

### 1. Overview (Dashboard Home)
- Recent orders count (last 7 days)
- Total photos count
- Revenue this month
- Pending orders count
- Quick actions (Upload Photo, View Orders)

### 2. Photo Management
- List all photos (table view)
- Upload new photos
- Edit photo metadata
- Delete photos
- Reorder photos
- Filter by category
- Bulk actions (future)

### 3. Category Management
- List categories
- Create new category
- Edit category
- Delete category (if no photos)
- Reorder categories

### 4. Order Management
- List all orders (table view)
- Filter by status
- Search by order ID or customer email
- View order details
- Update order status (manual override)
- Resubmit to Bay Photo (for failed orders)
- Print packing slip (future)

### 5. Product Management
- View product types and sizes
- Update pricing
- Add new product types/sizes
- Deactivate products

## Layout
- **Sidebar**: Navigation menu
- **Header**: Admin title, user info, logout
- **Main**: Content area
- **Mobile**: Collapsible sidebar

## Implementation Tasks

### Layout Components
- [ ] Create `src/app/admin/layout/admin-layout.component.ts`
  - [ ] Sidebar navigation
  - [ ] Header with user info
  - [ ] Content area (router-outlet)
  - [ ] Responsive drawer for mobile
- [ ] Create `src/app/admin/layout/admin-sidebar/admin-sidebar.component.ts`
  - [ ] Navigation links
  - [ ] Active route highlighting
  - [ ] Icon + text menu items

### Dashboard Components
- [ ] Create `src/app/admin/dashboard/dashboard.component.ts`
  - [ ] Route: `/admin`
  - [ ] Stats cards (Material cards)
  - [ ] Recent orders list
  - [ ] Quick actions
- [ ] Create `src/app/admin/photos/photo-list/photo-list.component.ts`
  - [ ] Route: `/admin/photos`
  - [ ] Table with thumbnails
  - [ ] Edit/delete actions
  - [ ] Pagination
  - [ ] Filter by category
- [ ] Create `src/app/admin/photos/photo-upload/photo-upload.component.ts`
  - [ ] Route: `/admin/photos/upload`
  - [ ] File upload (drag & drop)
  - [ ] Form: title, description, category
  - [ ] Image preview
  - [ ] Upload progress
- [ ] Create `src/app/admin/photos/photo-edit/photo-edit.component.ts`
  - [ ] Route: `/admin/photos/:id/edit`
  - [ ] Edit form
  - [ ] Update metadata
  - [ ] Change category
- [ ] Create `src/app/admin/categories/category-list/category-list.component.ts`
  - [ ] Route: `/admin/categories`
  - [ ] Table view
  - [ ] Create/edit/delete
  - [ ] Reorder categories
- [ ] Create `src/app/admin/orders/order-list/order-list.component.ts`
  - [ ] Route: `/admin/orders`
  - [ ] Table with filters
  - [ ] Status badges
  - [ ] Search functionality
- [ ] Create `src/app/admin/orders/order-detail/order-detail.component.ts`
  - [ ] Route: `/admin/orders/:id`
  - [ ] Order summary
  - [ ] Items list
  - [ ] Customer info
  - [ ] Shipping details
  - [ ] Status timeline
  - [ ] Resubmit to Bay Photo button
- [ ] Create `src/app/admin/products/product-list/product-list.component.ts`
  - [ ] Route: `/admin/products`
  - [ ] Product types and sizes
  - [ ] Edit pricing
  - [ ] Add new products

### Services
- [ ] Create `src/app/services/admin.service.ts`
  - [ ] getDashboardStats()
  - [ ] getOrders(filters)
  - [ ] updateOrderStatus(orderId, status)
  - [ ] resubmitOrder(orderId)
- [ ] Create `src/app/services/category.service.ts`
  - [ ] getCategories()
  - [ ] createCategory(data)
  - [ ] updateCategory(id, data)
  - [ ] deleteCategory(id)
- [ ] Create `src/app/services/product.service.ts`
  - [ ] getProductTypes()
  - [ ] getProductSizes()
  - [ ] updatePricing(id, price)

### Routes
- [ ] Create `src/app/admin/admin.routes.ts`
  - [ ] Configure admin routes
  - [ ] Set up layout wrapper
  - [ ] Apply admin guard

## Material Components Used
- **MatSidenav**: Sidebar navigation
- **MatToolbar**: Header
- **MatCard**: Dashboard stats, content cards
- **MatTable**: Photo list, order list
- **MatPaginator**: Pagination
- **MatSort**: Column sorting
- **MatFormField**: Form inputs
- **MatButton**: Actions
- **MatIcon**: Icons throughout
- **MatChip**: Status badges
- **MatDialog**: Confirmations, modals
- **MatSnackBar**: Success/error messages
- **MatProgressBar**: Upload progress
- **MatMenu**: Dropdown actions

## Admin Routes Configuration

```typescript
// src/app/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'photos',
        loadComponent: () => import('./photos/photo-list/photo-list.component')
          .then(m => m.PhotoListComponent)
      },
      {
        path: 'photos/upload',
        loadComponent: () => import('./photos/photo-upload/photo-upload.component')
          .then(m => m.PhotoUploadComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders/order-list/order-list.component')
          .then(m => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./orders/order-detail/order-detail.component')
          .then(m => m.OrderDetailComponent)
      },
      // More routes...
    ]
  }
];
```

## Dashboard Stats API

```typescript
// GET /api/admin/stats
{
  "totalOrders": 156,
  "ordersThisWeek": 12,
  "revenue": 345600, // in cents
  "revenueThisMonth": 89400,
  "totalPhotos": 234,
  "activePhotos": 198,
  "pendingOrders": 3,
  "recentOrders": [
    { id, total, status, createdAt }
  ]
}
```

## Testing Checklist
- [ ] Access admin dashboard (requires admin role)
- [ ] View dashboard stats
- [ ] Navigate between admin sections
- [ ] Upload new photo
- [ ] Edit photo metadata
- [ ] Delete photo
- [ ] View order list
- [ ] Filter orders by status
- [ ] View order details
- [ ] Update pricing
- [ ] Create category
- [ ] Edit category
- [ ] Responsive sidebar on mobile
- [ ] All admin routes protected by guards
- [ ] Non-admin cannot access admin area

## UI/UX Considerations
- **Confirmation dialogs**: Before delete actions
- **Success messages**: After create/update/delete
- **Error handling**: Display user-friendly errors
- **Loading states**: Show spinners during API calls
- **Empty states**: Friendly messages when no data
- **Responsive**: Works on tablet and desktop
- **Keyboard shortcuts**: Quick actions (future)
- **Batch operations**: Select multiple items (future)

## Future Enhancements (Post-MVP)
- Advanced analytics and charts
- User management
- Bulk photo upload
- Image editing tools
- Email template management
- Settings management
- Activity log/audit trail
- Export data (CSV, PDF)
