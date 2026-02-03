/**
 * Authentication Service
 * Handles user authentication, token management, and auth state
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
  User, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  ApiResponse 
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Signals for reactive state management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Computed signals
  public isAuthenticated = computed(() => !!this.currentUserSubject.value);
  public isAdmin = computed(() => this.currentUserSubject.value?.role === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Load user from storage on app init
   */
  private loadUserFromStorage(): void {
    const token = this.getAccessToken();
    console.log('[AuthService] Loading user from storage, token exists:', !!token);
    
    if (token) {
      // First check if token is expired by decoding it
      try {
        const payload = this.decodeToken(token);
        const isExpired = payload?.exp && payload.exp < Math.floor(Date.now() / 1000);
        
        console.log('[AuthService] Token decoded, expired:', isExpired, 'exp:', payload?.exp, 'now:', Math.floor(Date.now() / 1000));
        
        if (isExpired) {
          console.log('[AuthService] Token expired, attempting refresh...');
          // Token is expired, try to refresh it
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            this.refreshToken().subscribe({
              next: () => {
                console.log('[AuthService] Token refreshed successfully, loading user...');
                // After refresh, load user
                this.getCurrentUser().subscribe({
                  next: (user) => {
                    console.log('[AuthService] User loaded:', user.email);
                    this.currentUserSubject.next(user);
                  },
                  error: (err) => {
                    console.error('[AuthService] Failed to load user after refresh:', err);
                    this.clearTokens();
                  }
                });
              },
              error: (err) => {
                console.error('[AuthService] Token refresh failed:', err);
                this.clearTokens();
              }
            });
          } else {
            console.warn('[AuthService] No refresh token available, clearing tokens');
            this.clearTokens();
          }
        } else {
          console.log('[AuthService] Token valid, verifying with server...');
          // Token is valid, verify it with the server
          // Defer the API call slightly to ensure HTTP client is ready
          setTimeout(() => {
            this.getCurrentUser().subscribe({
              next: (user) => {
                console.log('[AuthService] User verified:', user.email);
                this.currentUserSubject.next(user);
              },
              error: (err) => {
                // Silently handle initialization errors (NG0200)
                if (err.message && err.message.includes('NG0200')) {
                  console.warn('[AuthService] HTTP not ready during init, will verify on first navigation');
                  return;
                }
                
                console.error('[AuthService] User verification failed:', err);
                // Only clear tokens if it's an auth error (401/403)
                // For other errors (network, 500, etc.), keep the tokens
                if (err.status === 401 || err.status === 403) {
                  console.log('[AuthService] Auth error, attempting token refresh...');
                // Try to refresh the token first
                const refreshToken = this.getRefreshToken();
                if (refreshToken) {
                  this.refreshToken().subscribe({
                    next: () => {
                      console.log('[AuthService] Token refreshed after 401, retrying user load...');
                      // After refresh, try loading user again
                      this.getCurrentUser().subscribe({
                        next: (user) => {
                          console.log('[AuthService] User loaded after refresh:', user.email);
                          this.currentUserSubject.next(user);
                        },
                        error: (retryErr) => {
                          console.error('[AuthService] Failed to load user after refresh retry:', retryErr);
                          this.clearTokens();
                        }
                      });
                    },
                    error: (refreshErr) => {
                      console.error('[AuthService] Token refresh failed after 401:', refreshErr);
                      this.clearTokens();
                    }
                  });
                } else {
                  console.warn('[AuthService] No refresh token for 401 error, clearing tokens');
                  this.clearTokens();
                }
              } else {
                // For other errors, keep tokens and just log the error
                console.warn('[AuthService] Non-auth error, keeping tokens.');
              }
            }
          });
        }, 0);
        }
      } catch (e) {
        // If token decode fails, it's invalid - clear it
        console.error('[AuthService] Invalid token format, clearing:', e);
        this.clearTokens();
      }
    } else {
      console.log('[AuthService] No token found in storage');
    }
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<User> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.handleAuthResponse(response.data);
          }
        }),
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Registration failed');
          }
          return response.data.user;
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Login user
   */
  login(data: LoginRequest): Observable<User> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.handleAuthResponse(response.data);
          }
        }),
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Login failed');
          }
          return response.data.user;
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/logout`, { refreshToken })
      .pipe(
        tap(() => {
          this.clearTokens();
          this.currentUserSubject.next(null);
          this.router.navigate(['/']);
        }),
        map(() => void 0),
        catchError(() => {
          // Even if logout fails, clear local tokens
          this.clearTokens();
          this.currentUserSubject.next(null);
          this.router.navigate(['/']);
          return throwError(() => new Error('Logout failed'));
        })
      );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      `${this.API_URL}/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAccessToken(response.data.accessToken);
          this.setRefreshToken(response.data.refreshToken);
        }
      }),
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Token refresh failed');
        }
        return response.data.accessToken;
      }),
      catchError(error => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.API_URL}/me`)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error('Failed to get user');
          }
          return response.data.user;
        }),
        tap(user => this.currentUserSubject.next(user)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Handle successful authentication response
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.setAccessToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    this.currentUserSubject.next(response.user);
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Set access token in storage
   */
  private setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Set refresh token in storage
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Clear all tokens from storage
   */
  private clearTokens(): void {
    console.log('[AuthService] Clearing all tokens from storage');
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticatedSync(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Check if current user is admin
   */
  isAdminSync(): boolean {
    // First check the current user subject
    if (this.currentUserSubject.value) {
      return this.currentUserSubject.value.role === 'admin';
    }
    
    // If user not loaded yet, try to decode token
    const token = this.getAccessToken();
    if (token) {
      try {
        const payload = this.decodeToken(token);
        return payload?.role === 'admin';
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Decode JWT token to get payload
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
