import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FrameStyle {
  profile_name: string;
  color_name: string;
  profile_width_num: string;
  profile_width_frac: string;
  profile_max_width_complete: string;
  profile_max_height_complete: string;
}

export interface FrameCover {
  cover_name: string;
}

export interface FrameBacking {
  backing_name: string;
}

export interface FrameMat {
  mat_type_id: string;
  mat_type_name: string;
  mat_design_id: string;
  mat_design_name: string;
}

export interface FrameItems {
  styles: FrameStyle[];
  covers: FrameCover[];
  backings: FrameBacking[];
  mats: FrameMat[];
}

export interface FrameConfig {
  profile: string;
  color: string;
  width: number;
  height: number;
  cover?: string;
  backing?: string;
  outer_mat_type?: string;
  outer_mat_color?: string;
  outer_mat_thickness?: number;
  inner_mat_type?: string;
  inner_mat_color?: string;
  inner_mat_thickness?: number;
  image_url?: string;
}

export interface FramePrice {
  attributes: any;
  display_attributes: {
    'Art Size': string;
    'Outside Frame Size': string;
    'Style': string;
    'Outer Mat'?: string;
    'Inner Mat'?: string;
    'Cover': string;
    'Backing': string;
  };
  is_valid: boolean;
  name: string;
  price: string;
  quantity: number;
  sku: string;
  shipping_estimate?: {
    price: string;
    shipping_template_group: string;
  };
}

export interface OrderItem {
  photo_id: string;
  sku: string;
  quantity: number;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  email: string;
}

export interface Order {
  id: string;
  frameiteasy_order_id: string;
  frameiteasy_order_number: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FulfillmentService {
  constructor(private http: HttpClient) {}

  /**
   * Get all available frame items (styles, colors, mats, covers, backings)
   */
  getFrameItems(): Observable<FrameItems> {
    return this.http.get<{ success: boolean; data: { items: FrameItems; message: string } }>(
      `${environment.apiUrl}/fulfillment/items`
    ).pipe(
      map(response => {
        console.log('[FulfillmentService] getFrameItems response:', response);
        if (response.success && response.data && response.data.items) {
          return response.data.items;
        }
        throw new Error('Failed to fetch frame items');
      })
    );
  }

  /**
   * Calculate price for a frame configuration
   */
  calculateFramePrice(config: FrameConfig): Observable<FramePrice> {
    return this.http.post<{ success: boolean; data: { frame: FramePrice } }>(
      `${environment.apiUrl}/fulfillment/calculate`,
      config
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.frame;
        }
        throw new Error('Failed to calculate frame price');
      })
    );
  }

  /**
   * Create an order
   */
  createOrder(items: OrderItem[], shipping: ShippingAddress): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(
      `${environment.apiUrl}/fulfillment/orders`,
      { items, shipping }
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to create order');
      })
    );
  }

  /**
   * Get all orders for the authenticated user
   */
  getOrders(): Observable<Order[]> {
    return this.http.get<{ success: boolean; data: { orders: Order[] } }>(
      `${environment.apiUrl}/fulfillment/orders`
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data.orders;
        }
        throw new Error('Failed to fetch orders');
      })
    );
  }

  /**
   * Get order details by ID
   */
  getOrderById(orderId: string): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(
      `${environment.apiUrl}/fulfillment/orders/${orderId}`
    ).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to fetch order details');
      })
    );
  }
}
