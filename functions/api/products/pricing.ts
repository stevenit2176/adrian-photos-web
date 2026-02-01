/**
 * GET /api/products/pricing
 * Get all product types with their sizes and pricing
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';
import { getProductsWithSizes } from '../../lib/db';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env } = context;

    // Get all active product types with their sizes
    const products = await getProductsWithSizes(env.DB);

    return successResponse({
      products,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return errorResponse('Failed to get products', 500, 'SERVER_ERROR');
  }
}
