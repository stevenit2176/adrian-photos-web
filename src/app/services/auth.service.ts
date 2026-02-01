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
    if (token) {
      // Verify token and load user
      this.getCurrentUser().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.clearTokens()
      });
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
    return this.currentUserSubject.value?.role === 'admin';
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
