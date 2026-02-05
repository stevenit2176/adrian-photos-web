/**
 * GET /api/fulfillment/orders/[id]
 * Get order details by ID including fulfillment status
 * Requires authentication
 */

import { requireAuth } from '../../../lib/middleware';
import { getFrameOrder } from '../../../lib/frameiteasy';
import { successResponse, errorResponse } from '../../../lib/utils';
import { queryOne, execute } from '../../../lib/db';
import { Env } from '../../../lib/types';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env, params } = context as { 
      request: Request; 
      env: Env;
      params: { id: string };
    };

    // Require authentication
    const user = await requireAuth(request, env);

    const orderId = params.id;

    if (!orderId) {
      return errorResponse('Order ID is required', 400, 'VALIDATION_ERROR');
    }

    // Get order from our database
    const order = await queryOne(
      env.DB,
      `SELECT 
        id, user_id, frameiteasy_order_id, frameiteasy_order_number,
        status, total_amount, shipping_address, created_at, updated_at
       FROM orders 
       WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return errorResponse('Order not found', 404, 'NOT_FOUND');
    }

    // Verify user owns this order
    if (order.user_id !== user.userId) {
      return errorResponse('Unauthorized', 403, 'FORBIDDEN');
    }

    // Get latest status from Frame It Easy
    const frameItEasyOrder = await getFrameOrder(env, order.frameiteasy_order_id);

    // Update our database if status changed
    if (frameItEasyOrder.status !== order.status) {
      await execute(
        env.DB,
        'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
        [frameItEasyOrder.status, new Date().toISOString(), orderId]
      );
    }

    // Get order items
    const itemsResult = await env.DB.prepare(
      `SELECT 
        oi.id, oi.photo_id, oi.sku, oi.quantity,
        p.title as photo_title, p.r2_key
       FROM order_items oi
       LEFT JOIN photos p ON oi.photo_id = p.id
       WHERE oi.order_id = ?`
    ).bind(orderId).all();

    return successResponse({
      order: {
        ...order,
        status: frameItEasyOrder.status,
        shipping_tracking: frameItEasyOrder.shipping_tracking,
        shipping_carrier: frameItEasyOrder.shipping_carrier,
        items: itemsResult.results || []
      },
      frameiteasy_order: frameItEasyOrder,
      message: 'Order details retrieved successfully'
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    return errorResponse(
      `Failed to retrieve order: ${error.message}`,
      500,
      'ORDER_ERROR'
    );
  }
}
