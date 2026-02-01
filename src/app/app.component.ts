import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar class="navbar">
      <span class="logo">Adrian Photos</span>
      <span class="spacer"></span>
      <nav>
        <button mat-button>Home</button>
        <button mat-button>Gallery</button>
        <button mat-button>Categories</button>
        <button mat-button>About</button>
        <button mat-button>Contact</button>
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
    }

    .spacer {
      flex: 1 1 auto;
    }

    nav {
      display: flex;
      gap: 8px;
    }

    nav button {
      font-family: 'Barlow', sans-serif;
      font-size: 16px;
      font-weight: 400;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    
    nav button:hover {
      background-color: rgba(226, 191, 85, 0.2);
    }

    @media (max-width: 768px) {
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
}
