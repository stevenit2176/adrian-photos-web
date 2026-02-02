/**
 * PUT /api/categories/:id/update
 * Update a category (admin only)
 */

import { requireAdmin } from '../../../lib/middleware';
import { Env } from '../../../lib/types';
import { successResponse, errorResponse } from '../../../lib/utils';
import { execute, queryOne } from '../../../lib/db';

export async function onRequestPut(context: any): Promise<Response> {
  try {
    const { request, env, params } = context;

    // Admin authentication required
    const user = await requireAdmin(request, env);

    const categoryId = params.id;
    const body = await request.json();
    const { name, slug, description, displayOrder, isActive, imageR2Key, imageAltText } = body;

    // Validation
    if (!name || !slug) {
      return errorResponse('Name and slug are required', 400, 'VALIDATION_ERROR');
    }

    // Check if category exists
    const existingCategory = await queryOne(env.DB, `
      SELECT id FROM categories WHERE id = ?
    `, [categoryId]);

    if (!existingCategory) {
      return errorResponse('Category not found', 404, 'NOT_FOUND');
    }

    // Check if slug is taken by another category
    const slugCheck = await queryOne(env.DB, `
      SELECT id FROM categories WHERE slug = ? AND id != ?
    `, [slug, categoryId]);

    if (slugCheck) {
      return errorResponse('Slug already in use by another category', 400, 'DUPLICATE_SLUG');
    }

    // Update category
    await execute(env.DB, `
      UPDATE categories
      SET name = ?,
          slug = ?,
          description = ?,
          display_order = ?,
          is_active = ?,
          image_r2_key = ?,
          image_alt_text = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      slug,
      description || null,
      displayOrder !== undefined ? displayOrder : 0,
      isActive !== false ? 1 : 0,
      imageR2Key || null,
      imageAltText || null,
      categoryId
    ]);

    // Fetch updated category
    const category = await queryOne(env.DB, `
      SELECT id, name, slug, description, display_order, is_active,
             image_r2_key, image_alt_text, created_at, updated_at
      FROM categories
      WHERE id = ?
    `, [categoryId]);

    return successResponse({
      category
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return errorResponse(`Failed to update category: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
