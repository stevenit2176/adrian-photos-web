import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule
  ],
  template: `
    <a mat-icon-button routerLink="/cart" class="cart-icon">
      <mat-icon [matBadge]="itemCount" [matBadgeHidden]="itemCount === 0" matBadgeColor="warn">
        shopping_cart
      </mat-icon>
    </a>
  `,
  styles: [`
    .cart-icon {
      color: white;
      
      mat-icon {
        color: white;
      }
    }
  `]
})
export class CartIconComponent implements OnInit {
  itemCount = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.itemCount = cart.itemCount;
    });
  }
}
