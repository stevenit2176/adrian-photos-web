import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyticsService, AnalyticsStats } from '../../services/analytics.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  analyticsStats: AnalyticsStats | null = null;
  loadingAnalytics = true;
  private routerSubscription?: Subscription;
  private isInitialLoad = true;

  // GA4 Configuration
  measurementId = environment.ga4MeasurementId;
  propertyId = '523127739';
  apiSecretConfigured = !!environment.ga4ApiSecret;

  constructor(
    private analyticsService: AnalyticsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load analytics on initialization
    this.loadAnalytics();
    
    // Subscribe to router events to detect when user navigates TO this route
    // Skip the first navigation event since we already loaded in ngOnInit
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Skip the initial navigation (happens right after ngOnInit)
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          return;
        }
        // If navigating to analytics, reload analytics
        if (event.urlAfterRedirects.includes('/admin/analytics')) {
          console.log('[Analytics] Analytics route detected, reloading analytics');
          this.loadAnalytics();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadAnalytics(): void {
    this.loadingAnalytics = true;
    this.cdr.detectChanges();
    this.analyticsService.getStats().subscribe({
      next: (stats) => {
        this.analyticsStats = stats;
        this.loadingAnalytics = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.loadingAnalytics = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}
