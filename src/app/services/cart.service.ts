import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cart, CartItem, CartCalculation, AddToCartRequest } from '../models/cart.model';
import { environment } from '../../environments/environment';

const CART_STORAGE_KEY = 'adrian-photos-cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>(this.getInitialCart());
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private getInitialCart(): Cart {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      taxRate: 0,
      shipping: 0,
      total: 0,
      itemCount: 0
    };
  }

  private loadCart(): void {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const cart = JSON.parse(stored) as Cart;
        this.cartSubject.next(cart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      this.clearCart();
    }
  }

  private saveCart(cart: Cart): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      this.cartSubject.next(cart);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  addItem(request: AddToCartRequest): void {
    const cart = this.cartSubject.value;
    const quantity = request.quantity || 1;

    // Check if item already exists (same photo + product type + size)
    const existingItemIndex = cart.items.findIndex(
      item =>
        item.photoId === request.photoId &&
        item.productTypeId === request.productTypeId &&
        item.productSizeId === request.productSizeId
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].total =
        cart.items[existingItemIndex].unitPrice * cart.items[existingItemIndex].quantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        id: this.generateItemId(),
        photoId: request.photoId,
        photoTitle: request.photoTitle,
        photoThumbnail: request.photoThumbnail,
        productTypeId: request.productTypeId,
        productTypeName: request.productTypeName,
        productSizeId: request.productSizeId,
        productSizeName: request.productSizeName,
        unitPrice: request.unitPrice,
        quantity,
        total: request.unitPrice * quantity
      };
      cart.items.push(newItem);
    }

    this.recalculateCart(cart);
  }

  updateQuantity(itemId: string, quantity: number): void {
    const cart = this.cartSubject.value;
    const item = cart.items.find(i => i.id === itemId);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.quantity = quantity;
        item.total = item.unitPrice * quantity;
        this.recalculateCart(cart);
      }
    }
  }

  removeItem(itemId: string): void {
    const cart = this.cartSubject.value;
    cart.items = cart.items.filter(item => item.id !== itemId);
    this.recalculateCart(cart);
  }

  clearCart(): void {
    const emptyCart = this.getInitialCart();
    this.saveCart(emptyCart);
  }

  getCart(): Cart {
    return this.cartSubject.value;
  }

  getItemCount(): number {
    return this.cartSubject.value.itemCount;
  }

  private recalculateCart(cart: Cart): void {
    // Calculate subtotal
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // For now, set tax and shipping to 0 - will be calculated at checkout
    cart.tax = 0;
    cart.taxRate = 0;
    cart.shipping = 0;
    cart.total = cart.subtotal;

    this.saveCart(cart);
  }

  calculateTotals(shippingState?: string): Observable<CartCalculation> {
    const cart = this.cartSubject.value;

    if (cart.items.length === 0) {
      return new Observable(observer => {
        observer.next({
          subtotal: 0,
          tax: 0,
          taxRate: 0,
          shipping: 0,
          total: 0,
          itemCount: 0
        });
        observer.complete();
      });
    }

    const requestBody = {
      items: cart.items.map(item => ({
        id: item.id,
        photoId: item.photoId,
        productTypeId: item.productTypeId,
        productSizeId: item.productSizeId,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      shippingState
    };

    return this.http.post<{ success: boolean; data: CartCalculation }>(
      `${environment.apiUrl}/cart/calculate`,
      requestBody
    ).pipe(
      map(response => {
        if (response.success) {
          // Update cart with calculated values
          const updatedCart = { ...cart, ...response.data };
          this.saveCart(updatedCart);
          return response.data;
        }
        throw new Error('Failed to calculate cart totals');
      })
    );
  }

  private generateItemId(): string {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
