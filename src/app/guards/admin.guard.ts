/**
 * Admin Guard
 * Protects routes that require admin role
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticatedSync()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  // Check if user is admin
  if (authService.isAdminSync()) {
    return true;
  }

  // User is authenticated but not admin, redirect to home
  router.navigate(['/']);
  return false;
};
