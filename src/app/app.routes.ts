import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'gallery', loadComponent: () => import('./gallery/gallery.component').then(m => m.GalleryComponent) },
  { path: 'categories/:id', loadComponent: () => import('./category/category.component').then(m => m.CategoryComponent) },
  { path: 'photos/:id', loadComponent: () => import('./photo-detail/photo-detail.component').then(m => m.PhotoDetailComponent) },
  { path: 'cart', loadComponent: () => import('./cart/cart.component').then(m => m.CartComponent) },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  
  // Protected routes (require authentication)
  // Example: { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  
  // Admin routes (require admin role)
  {
    path: 'admin',
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'photos', loadComponent: () => import('./admin/photos/photo-list/photo-list.component').then(m => m.PhotoListComponent) },
      { path: 'photos/upload', loadComponent: () => import('./admin/photos/photo-upload/photo-upload.component').then(m => m.PhotoUploadComponent) },
      { path: 'photos/edit/:id', loadComponent: () => import('./admin/photos/photo-edit/photo-edit.component').then(m => m.PhotoEditComponent) },
      { path: 'categories', loadComponent: () => import('./admin/categories/category-list.component').then(m => m.CategoryListComponent) },
      { path: 'orders', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create OrderListComponent
      { path: 'products', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create ProductListComponent
      { path: 'analytics', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create AnalyticsComponent
      { path: 'settings', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) } // TODO: Create SettingsComponent
    ]
  }
];
