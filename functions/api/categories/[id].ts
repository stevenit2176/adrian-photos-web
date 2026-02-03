/**
 * GET /api/categories/:id
 * Get a single category by ID
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env, params } = context;
    const idOrSlug = params.id;

    console.log('Category ID/Slug requested:', idOrSlug);

    if (!idOrSlug) {
      return errorResponse('Category ID or slug is required', 400, 'VALIDATION_ERROR');
    }

    // Get category by ID or slug
    const result = await env.DB.prepare(
      `SELECT id, name, slug, description, display_order as displayOrder, 
              is_active as isActive, image_r2_key as imageR2Key, image_alt_text as imageAltText,
              created_at as createdAt, updated_at as updatedAt
       FROM categories 
       WHERE (id = ? OR slug = ?) AND is_active = 1`
    )
      .bind(idOrSlug, idOrSlug)
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
