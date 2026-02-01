import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'gallery', loadComponent: () => import('./gallery/gallery.component').then(m => m.GalleryComponent) },
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
      { path: 'photos', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create PhotoListComponent
      { path: 'categories', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create CategoryListComponent
      { path: 'orders', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create OrderListComponent
      { path: 'products', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create ProductListComponent
      { path: 'analytics', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) }, // TODO: Create AnalyticsComponent
      { path: 'settings', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) } // TODO: Create SettingsComponent
    ]
  }
];
