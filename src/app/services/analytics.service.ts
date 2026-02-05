/**
 * Analytics Service
 * Handles fetching analytics data from backend
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AnalyticsStats {
  totalVisitors: number;
  visitorsToday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  pageViews: number;
  avgSessionDuration: number;
  topPages: { path: string; views: number }[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_URL = '/api/analytics';

  constructor(private http: HttpClient) {}

  /**
   * Get analytics stats
   */
  getStats(): Observable<AnalyticsStats> {
    const url = `${this.API_URL}/stats`;
    console.log('[AnalyticsService] Fetching stats from:', url);
    
    return this.http.get<ApiResponse<AnalyticsStats>>(url)
      .pipe(
        map(response => {
          console.log('[AnalyticsService] Raw response:', response);
          
          if (!response) {
            console.error('[AnalyticsService] No response received');
            throw new Error('No response from server');
          }
          
          if (!response.success) {
            console.error('[AnalyticsService] API returned error:', response.error);
            throw new Error(response.error?.message || 'API returned unsuccessful response');
          }
          
          if (!response.data) {
            console.error('[AnalyticsService] No data in response');
            throw new Error('No data in response');
          }
          
          console.log('[AnalyticsService] Successfully parsed data:', response.data);
          return response.data;
        })
      );
  }

  /**
   * Format session duration as readable string
   */
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  }
}
