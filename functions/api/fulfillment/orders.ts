/**
 * POST /api/fulfillment/orders
 * Create a new order with Frame It Easy
 * Requires authentication
 * 
 * GET /api/fulfillment/orders
 * Get all orders for the authenticated user
 */

import { requireAuth } from '../../lib/middleware';
import { createFrameOrder, getFrameOrders } from '../../lib/frameiteasy';
import { successResponse, errorResponse, generateId } from '../../lib/utils';
import { execute, queryOne } from '../../lib/db';
import { Env } from '../../lib/types';

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context as { request: Request; env: Env };

    // Require authentication
    const user = await requireAuth(request, env);

    const body = await request.json() as {
      items: Array<{
        photo_id: string;
        sku: string;
        quantity: number;
      }>;
      shipping: {
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
      };
    };

    // Validate required fields
    if (!body.items || !body.items.length) {
      return errorResponse('At least one item is required', 400, 'VALIDATION_ERROR');
    }

    if (!body.shipping || !body.shipping.first_name || !body.shipping.last_name || 
        !body.shipping.address1 || !body.shipping.city || !body.shipping.state || 
        !body.shipping.zip || !body.shipping.email) {
      return errorResponse('Complete shipping information is required', 400, 'VALIDATION_ERROR');
    }

    // Build order items with image URLs from our R2 storage
    const orderItems = await Promise.all(
      body.items.map(async (item) => {
        // Get the photo from database to get R2 key
        const photo = await queryOne(
          env.DB,
          'SELECT id, r2_key FROM photos WHERE id = ?',
          [item.photo_id]
        );

        if (!photo) {
          throw new Error(`Photo not found: ${item.photo_id}`);
        }

        // Construct full image URL that Frame It Easy can access
        const imageUrl = `${new URL(request.url).origin}/api/photos/image?key=${encodeURIComponent(photo.r2_key)}`;

        return {
          sku: item.sku,
          quantity: item.quantity,
          image_url: imageUrl
        };
      })
    );

    // Create order with Frame It Easy
    const frameItEasyOrder = await createFrameOrder(env, {
      items: orderItems,
      shipping: {
        ...body.shipping,
        country: body.shipping.country || 'US'
      }
    });

    // Save order to our database
    const orderId = generateId('ord');
    const now = new Date().toISOString();

    await execute(
      env.DB,
      `INSERT INTO orders (
        id, user_id, frameiteasy_order_id, frameiteasy_order_number,
        status, total_amount, shipping_address, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        user.userId,
        frameItEasyOrder.id,
        frameItEasyOrder.order_number,
        frameItEasyOrder.status,
        parseFloat(frameItEasyOrder.total),
        JSON.stringify(body.shipping),
        now,
        now
      ]
    );

    // Save order items
    for (const item of body.items) {
      await execute(
        env.DB,
        `INSERT INTO order_items (
          id, order_id, photo_id, sku, quantity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          generateId('itm'),
          orderId,
          item.photo_id,
          item.sku,
          item.quantity,
          now
        ]
      );
    }

    return successResponse({
      order_id: orderId,
      frameiteasy_order: frameItEasyOrder,
      message: 'Order created successfully'
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse(
      `Failed to create order: ${error.message}`,
      500,
      'ORDER_ERROR'
    );
  }
}

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context as { request: Request; env: Env };

    // Require authentication
    const user = await requireAuth(request, env);

    // Get orders from our database
    const result = await env.DB.prepare(
      `SELECT 
        id, frameiteasy_order_id, frameiteasy_order_number,
        status, total_amount, shipping_address, created_at, updated_at
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`
    ).bind(user.userId).all();

    const orders = result.results || [];

    return successResponse({
      orders,
      count: orders.length,
      message: 'Orders retrieved successfully'
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return errorResponse(
      `Failed to retrieve orders: ${error.message}`,
      500,
      'ORDER_ERROR'
    );
  }
}
