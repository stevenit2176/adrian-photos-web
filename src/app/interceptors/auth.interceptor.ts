/**
 * HTTP Interceptor for JWT authentication
 * Automatically attaches access token to requests and handles token refresh
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth header for auth endpoints (to avoid circular dependency)
  if (req.url.includes('/api/auth/login') || 
      req.url.includes('/api/auth/register') ||
      req.url.includes('/api/auth/refresh')) {
    return next(req);
  }

  // Get access token
  const accessToken = authService.getAccessToken();

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  // Send request and handle 401 errors (token expired)
  return next(authReq).pipe(
    catchError(error => {
      // If 401 Unauthorized and we have a refresh token, try to refresh
      if (error.status === 401 && authService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            // Retry original request with new token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError(refreshError => {
            // Refresh failed, let error propagate
            return throwError(() => refreshError);
          })
        );
      }
      
      // Not a 401 or no refresh token, propagate error
      return throwError(() => error);
    })
  );
};
