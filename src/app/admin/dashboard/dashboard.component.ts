import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

interface DashboardStats {
  totalOrders: number;
  ordersLastWeek: number;
  totalPhotos: number;
  revenueThisMonth: number;
  pendingOrders: number;
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
    MatChipsModule
  ],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome back! Here's what's happening with your store.</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card orders">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>shopping_bag</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Orders This Week</div>
              <div class="stat-value">{{ stats.ordersLastWeek }}</div>
              <div class="stat-change positive">+12% from last week</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card revenue">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Revenue This Month</div>
              <div class="stat-value">\${{ stats.revenueThisMonth.toLocaleString() }}</div>
              <div class="stat-change positive">+8% from last month</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card photos">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>photo_library</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Photos</div>
              <div class="stat-value">{{ stats.totalPhotos }}</div>
              <div class="stat-change neutral">Across 6 categories</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card pending">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>pending_actions</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Pending Orders</div>
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-change warning">Needs attention</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button mat-raised-button color="primary" routerLink="/admin/photos/upload">
            <mat-icon>cloud_upload</mat-icon>
            Upload Photo
          </button>
          <button mat-raised-button routerLink="/admin/orders">
            <mat-icon>shopping_cart</mat-icon>
            View Orders
          </button>
          <button mat-raised-button routerLink="/admin/categories">
            <mat-icon>category</mat-icon>
            Manage Categories
          </button>
          <button mat-raised-button routerLink="/admin/products">
            <mat-icon>inventory_2</mat-icon>
            Manage Products
          </button>
        </div>
      </div>

      <!-- Recent Orders -->
      <mat-card class="recent-orders">
        <mat-card-header>
          <mat-card-title>Recent Orders</mat-card-title>
          <button mat-button routerLink="/admin/orders">View All</button>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recentOrders" class="orders-table">
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef>Order #</th>
              <td mat-cell *matCellDef="let order">{{ order.orderNumber }}</td>
            </ng-container>

            <ng-container matColumnDef="customer">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let order">{{ order.customerName }}</td>
            </ng-container>

            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>Items</th>
              <td mat-cell *matCellDef="let order">{{ order.items }}</td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let order">\${{ order.total.toFixed(2) }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let order">
                <mat-chip [class]="'status-' + order.status">
                  {{ order.status | titlecase }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let order">{{ order.date | date:'short' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="order-row"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
      
      h1 {
        font-family: 'Prata', serif;
        font-size: 36px;
        color: #616e76;
        margin: 0 0 8px 0;
      }
      
      .subtitle {
        font-family: 'Barlow', sans-serif;
        font-size: 16px;
        color: #999;
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px !important;
      }
      
      .stat-icon {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: white;
        }
      }
      
      .stat-info {
        flex: 1;
      }
      
      .stat-label {
        font-family: 'Barlow', sans-serif;
        font-size: 14px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-family: 'Barlow', sans-serif;
        font-weight: 800;
        font-size: 32px;
        color: #616e76;
        line-height: 1;
        margin-bottom: 4px;
      }
      
      .stat-change {
        font-family: 'Barlow', sans-serif;
        font-size: 12px;
        font-weight: 600;
        
        &.positive {
          color: #4caf50;
        }
        
        &.neutral {
          color: #999;
        }
        
        &.warning {
          color: #ff9800;
        }
      }
      
      &.orders .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.revenue .stat-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.photos .stat-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.pending .stat-icon {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
    }

    .quick-actions {
      margin-bottom: 32px;
      
      h2 {
        font-family: 'Prata', serif;
        font-size: 24px;
        color: #616e76;
        margin: 0 0 16px 0;
      }
      
      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        
        button {
          font-family: 'Barlow', sans-serif;
          font-weight: 800;
          
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    }

    .recent-orders {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        mat-card-title {
          font-family: 'Prata', serif;
          font-size: 24px;
          color: #616e76;
          margin: 0;
        }
        
        button {
          font-family: 'Barlow', sans-serif;
          font-weight: 800;
          color: #e2bf55;
        }
      }
      
      .orders-table {
        width: 100%;
        
        th {
          font-family: 'Barlow', sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: #616e76;
        }
        
        td {
          font-family: 'Barlow', sans-serif;
          font-size: 14px;
          color: #666;
        }
        
        .order-row {
          cursor: pointer;
          transition: background 0.2s ease;
          
          &:hover {
            background: rgba(226, 191, 85, 0.05);
          }
        }
      }
      
      mat-chip {
        font-family: 'Barlow', sans-serif;
        font-weight: 700;
        font-size: 12px;
        
        &.status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        &.status-processing {
          background: #cfe2ff;
          color: #084298;
        }
        
        &.status-shipped {
          background: #d1e7dd;
          color: #0f5132;
        }
        
        &.status-completed {
          background: #d1e7dd;
          color: #0a3622;
        }
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .action-buttons {
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalOrders: 142,
    ordersLastWeek: 23,
    totalPhotos: 0,
    revenueThisMonth: 8450,
    pendingOrders: 5
  };

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

  ngOnInit(): void {
    // In real implementation, fetch data from API
    // For now, using mockup data
  }
}
