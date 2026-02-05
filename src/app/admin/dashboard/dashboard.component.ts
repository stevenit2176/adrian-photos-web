import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalyticsService, AnalyticsStats } from '../../services/analytics.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface DashboardStats {
  totalOrders: number;
  ordersLastWeek: number;
  totalPhotos: number;
  revenueThisMonth: number;
  pendingOrders: number;
  // Analytics stats
  totalVisitors?: number;
  visitorsThisWeek?: number;
  visitorsThisMonth?: number;
  pageViews?: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed';
  date: Date;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    totalOrders: 142,
    ordersLastWeek: 23,
    totalPhotos: 0,
    revenueThisMonth: 8450,
    pendingOrders: 5
  };

  loadingAnalytics = true;
  private routerSubscription?: Subscription;
  private isInitialLoad = true;

  recentOrders: RecentOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-2026-001',
      customerName: 'Sarah Johnson',
      items: 3,
      total: 245.00,
      status: 'processing',
      date: new Date('2026-01-31T14:30:00')
    },
    {
      id: '2',
      orderNumber: 'ORD-2026-002',
      customerName: 'Michael Chen',
      items: 1,
      total: 89.99,
      status: 'pending',
      date: new Date('2026-01-31T11:15:00')
    },
    {
      id: '3',
      orderNumber: 'ORD-2026-003',
      customerName: 'Emily Rodriguez',
      items: 5,
      total: 425.50,
      status: 'shipped',
      date: new Date('2026-01-30T16:45:00')
    },
    {
      id: '4',
      orderNumber: 'ORD-2026-004',
      customerName: 'David Thompson',
      items: 2,
      total: 178.00,
      status: 'pending',
      date: new Date('2026-01-30T09:20:00')
    },
    {
      id: '5',
      orderNumber: 'ORD-2026-005',
      customerName: 'Jessica Martinez',
      items: 4,
      total: 312.75,
      status: 'completed',
      date: new Date('2026-01-29T13:10:00')
    }
  ];

  displayedColumns: string[] = ['orderNumber', 'customer', 'items', 'total', 'status', 'date'];

  constructor(
    private analyticsService: AnalyticsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load analytics summary data
    this.loadAnalyticsSummary();
    
    // Subscribe to router events to detect when user navigates TO this route
    // Skip the first navigation event since we already loaded in ngOnInit
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        // Skip the initial navigation (happens right after ngOnInit)
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          return;
        }
        // If navigating to dashboard, reload analytics summary
        if (event.urlAfterRedirects.includes('/admin/dashboard')) {
          console.log('[Dashboard] Dashboard route detected, reloading analytics summary');
          this.loadAnalyticsSummary();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadAnalyticsSummary(): void {
    this.loadingAnalytics = true;
    this.cdr.detectChanges();
    this.analyticsService.getStats().subscribe({
      next: (data) => {
        // Update only summary stats for dashboard
        this.stats.totalVisitors = data.totalVisitors;
        this.stats.visitorsThisWeek = data.visitorsThisWeek;
        this.stats.pageViews = data.pageViews;
        this.loadingAnalytics = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[Dashboard] Failed to load analytics:', error);
        this.loadingAnalytics = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}