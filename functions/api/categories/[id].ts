/**
 * GET /api/categories/:id
 * Get a single category by ID
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env, params } = context;
    const categoryId = params.id;

    console.log('Category ID requested:', categoryId);

    if (!categoryId) {
      return errorResponse('Category ID is required', 400, 'VALIDATION_ERROR');
    }

    // Get category by ID
    const result = await env.DB.prepare(
      `SELECT id, name, slug, description, display_order as displayOrder, 
              is_active as isActive, created_at as createdAt, updated_at as updatedAt
       FROM categories 
       WHERE id = ? AND is_active = 1`
    )
      .bind(categoryId)
      .first();

    console.log('Category result:', result);

    if (!result) {
      return errorResponse('Category not found', 404, 'NOT_FOUND');
    }

    return successResponse({
      category: result,
    });
  } catch (error: any) {
    console.error('Get category error:', error);
    return errorResponse('Failed to get category', 500, 'SERVER_ERROR');
  }
}
