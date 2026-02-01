import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './services/auth.service';
import { CartIconComponent } from './shared/cart-icon/cart-icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    CartIconComponent
  ],
  template: `
    <mat-toolbar class="navbar">
      <a routerLink="/" class="logo">Adrian Photos</a>
      <span class="spacer"></span>
      <nav>
        <app-cart-icon></app-cart-icon>
        <a mat-button routerLink="/gallery">Gallery</a>
        
        @if (authService.currentUser$ | async; as user) {
          <!-- Authenticated user menu -->
          <button mat-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
            {{ user.firstName || user.email }}
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-info">
              <div class="user-email">{{ user.email }}</div>
              @if (user.role === 'admin') {
                <div class="user-role">Admin</div>
              }
            </div>
            @if (user.role === 'admin') {
              <button mat-menu-item routerLink="/admin">
                <mat-icon>dashboard</mat-icon>
                Admin Dashboard
              </button>
            }
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </mat-menu>
        } @else {
          <!-- Guest menu -->
          <a mat-button routerLink="/login">Login</a>
          <a mat-button routerLink="/register" class="register-btn">Sign Up</a>
        }
      </nav>
    </mat-toolbar>
    <router-outlet />
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background-color: #616e76 !important;
      color: #ffffff !important;
      border-bottom: 1px solid #ffffff;
    }

    .logo {
      font-family: 'Prata', serif;
      font-size: 24px;
      font-weight: 400;
      letter-spacing: 1px;
      color: #ffffff;
      text-decoration: none;
      cursor: pointer;
      
      &:hover {
        opacity: 0.9;
      }
    }

    .spacer {
      flex: 1 1 auto;
    }

    nav {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    nav a,
    nav button {
      font-family: 'Barlow', sans-serif;
      font-size: 16px;
      font-weight: 400;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    
    nav a:hover,
    nav button:hover {
      background-color: rgba(226, 191, 85, 0.2);
    }

    .register-btn {
      background-color: #e2bf55 !important;
      color: #616e76 !important;
      font-weight: 600 !important;
      
      &:hover {
        background-color: rgba(226, 191, 85, 0.9) !important;
      }
    }

    .user-info {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      
      .user-email {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .user-role {
        font-size: 12px;
        color: #e2bf55;
        font-weight: 600;
      }
    }

    @media (max-width: 768px) {
      nav a,
      nav button {
        font-size: 14px;
        padding: 0 8px;
      }
      
      .logo {
        font-size: 20px;
      }
    }
  `]
})
export class AppComponent {
  title = 'Adrian Photos';

  constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout().subscribe();
  }
}
