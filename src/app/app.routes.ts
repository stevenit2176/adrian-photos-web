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
  // Example: { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent), canActivate: [adminGuard] }
];
