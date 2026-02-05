import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav mode="side" opened class="admin-sidenav">
        <div class="logo-section">
          <h2>Dashboard</h2>
          <span class="admin-badge">Admin</span>
        </div>
        
        <mat-nav-list>
          <a mat-list-item 
             *ngFor="let item of navItems" 
             [routerLink]="item.route"
             routerLinkActive="active">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="admin-toolbar">
          <span class="toolbar-spacer"></span>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu">
            <div class="user-info">
              <div class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
              <div class="user-email">{{ currentUser?.email }}</div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="viewSite()">
              <mat-icon>public</mat-icon>
              <span>View Site</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .admin-container {
      height: 100vh;
    }

    .admin-sidenav {
      width: 260px;
      background: linear-gradient(180deg, #616e76 0%, #515c63 100%);
      color: white;
      border-right: none;
    }

    .logo-section {
      padding: 24px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      h2 {
        margin: 0;
        font-family: 'Prata', serif;
        font-size: 24px;
        color: white;
      }
      
      .admin-badge {
        display: inline-block;
        margin-top: 8px;
        padding: 4px 12px;
        background: #e2bf55;
        color: #616e76;
        font-family: 'Barlow', sans-serif;
        font-weight: 800;
        font-size: 12px;
        text-transform: uppercase;
        border-radius: 12px;
        letter-spacing: 0.5px;
      }
    }

    mat-nav-list {
      padding-top: 16px;
      
      a {
        font-family: 'Barlow', sans-serif;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
          
          mat-icon, span {
            color: #e2bf55;
          }
        }
        
        &.active {
          background: rgba(226, 191, 85, 0.15);
          border-left: 4px solid #e2bf55;
          
          mat-icon, span {
            color: #e2bf55;
          }
        }
        
        mat-icon, span {
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }
      }
    }

    .admin-toolbar {
      background: white;
      color: #616e76;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      .toolbar-spacer {
        flex: 1;
      }
    }

    .user-info {
      padding: 12px 16px;
      
      .user-name {
        font-family: 'Barlow', sans-serif;
        font-weight: 800;
        font-size: 14px;
        color: #616e76;
      }
      
      .user-email {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
    }

    .admin-content {
      padding: 24px;
      background: #f5f7fa;
      min-height: calc(100vh - 64px);
    }

    mat-divider {
      margin: 8px 0;
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  currentUser: User | null = null;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Photos', icon: 'photo_library', route: '/admin/photos' },
    { label: 'Categories', icon: 'category', route: '/admin/categories' },
    { label: 'Orders', icon: 'shopping_cart', route: '/admin/orders' },
    { label: 'Products', icon: 'inventory_2', route: '/admin/products' },
    { label: 'Analytics', icon: 'analytics', route: '/admin/analytics' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  viewSite(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
