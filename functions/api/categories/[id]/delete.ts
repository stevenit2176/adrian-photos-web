/**
 * DELETE /api/categories/:id/delete
 * Delete a category (admin only)
 */

import { requireAdmin } from '../../../lib/middleware';
import { Env } from '../../../lib/types';
import { successResponse, errorResponse } from '../../../lib/utils';
import { execute, queryOne } from '../../../lib/db';

export async function onRequestDelete(context: any): Promise<Response> {
  try {
    const { request, env, params } = context;

    // Admin authentication required
    const user = await requireAdmin(request, env);

    const categoryId = params.id;

    // Check if category exists
    const category = await queryOne(env.DB, `
      SELECT id, image_r2_key FROM categories WHERE id = ?
    `, [categoryId]);

    if (!category) {
      return errorResponse('Category not found', 404, 'NOT_FOUND');
    }

    // Check if category has photos
    const photoCount = await queryOne(env.DB, `
      SELECT COUNT(*) as count FROM photos_categories WHERE category_id = ?
    `, [categoryId]);

    if (photoCount && photoCount.count > 0) {
      return errorResponse(
        'Cannot delete category with associated photos. Please reassign or delete photos first.',
        400,
        'CATEGORY_HAS_PHOTOS'
      );
    }

    // Delete category image from R2 if exists
    if (category.imageR2Key) {
      try {
        await env.R2.delete(category.imageR2Key);
      } catch (error) {
        console.error('Error deleting category image from R2:', error);
        // Continue with deletion even if R2 delete fails
      }
    }

    // Delete category
    await execute(env.DB, `
      DELETE FROM categories WHERE id = ?
    `, [categoryId]);

    return successResponse({
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return errorResponse(`Failed to delete category: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
