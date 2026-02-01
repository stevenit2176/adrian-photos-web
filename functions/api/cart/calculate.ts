/**
 * POST /api/cart/calculate
 * Calculate cart totals including tax and shipping
 * Public endpoint - no authentication required
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse, parseJsonBody } from '../../lib/utils';
import { validateState } from '../../lib/validation';

interface CartItem {
  id: string;
  photoId: string;
  productTypeId: string;
  productSizeId: string;
  unitPrice: number; // in cents
  quantity: number;
}

interface CalculateCartRequest {
  items: CartItem[];
  shippingState?: string;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request } = context;
    const body = await parseJsonBody<CalculateCartRequest>(request);

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('Cart items are required', 400, 'VALIDATION_ERROR');
    }

    // Calculate subtotal
    const subtotal = body.items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    // Calculate tax (8% for CA, 0% for others - simplified for MVP)
    let taxRate = 0;
    if (body.shippingState) {
      const state = body.shippingState.toUpperCase().trim();
      if (state === 'CA' || state === 'CALIFORNIA') {
        taxRate = 0.08; // 8% for California
      }
    }
    const tax = Math.round(subtotal * taxRate);

    // Calculate shipping (flat rate for MVP)
    const shipping = 1500; // $15.00 flat rate

    // Calculate total
    const total = subtotal + tax + shipping;

    return successResponse({
      subtotal,
      tax,
      taxRate,
      shipping,
      total,
      itemCount: body.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error: any) {
    console.error('Calculate cart error:', error);
    return errorResponse(`Failed to calculate cart: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
