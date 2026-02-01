/**
 * GET /api/categories
 * Get all active categories
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';
import { getCategories } from '../../lib/db';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env } = context;

    // Get all active categories
    const categories = await getCategories(env.DB, false);

    return successResponse({
      categories,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return errorResponse('Failed to get categories', 500, 'SERVER_ERROR');
  }
}
