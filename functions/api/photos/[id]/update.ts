/**
 * PUT /api/photos/:id
 * Update a photo's metadata
 * Requires admin role
 */

import { requireAdmin } from '../../../lib/middleware';
import { Env } from '../../../lib/types';
import { successResponse, errorResponse, parseJsonBody } from '../../../lib/utils';
import { execute, queryOne, queryAll } from '../../../lib/db';

interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  categoryIds?: string[];
  price?: number | null;
  isActive?: boolean;
}

export async function onRequestPut(context: any): Promise<Response> {
  try {
    const { request, params, env } = context;

    // Require admin authentication
    await requireAdmin(request, env);

    const photoId = params.id;

    if (!photoId) {
      return errorResponse('Photo ID is required', 400, 'VALIDATION_ERROR');
    }

    const body = await parseJsonBody<UpdatePhotoRequest>(request);

    // Check if photo exists
    const existing = await queryOne(env.DB, 'SELECT id FROM photos WHERE id = ?', [photoId]);
    if (!existing) {
      return errorResponse('Photo not found', 404, 'NOT_FOUND');
    }

    // Build update query
    const updates: string[] = [];
    const sqlParams: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      sqlParams.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      sqlParams.push(body.description);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      sqlParams.push(body.price);
    }
    if (body.isActive !== undefined) {
      updates.push('is_active = ?');
      sqlParams.push(body.isActive ? 1 : 0);
    }

    if (updates.length === 0 && !body.categoryIds) {
      return errorResponse('No fields to update', 400, 'VALIDATION_ERROR');
    }

    const now = new Date().toISOString();

    // Update photo metadata if there are changes
    if (updates.length > 0) {
      updates.push('updated_at = ?');
      sqlParams.push(now);
      sqlParams.push(photoId);

      await execute(
        env.DB,
        `UPDATE photos SET ${updates.join(', ')} WHERE id = ?`,
        sqlParams
      );
    }

    // Update category associations if provided
    if (body.categoryIds !== undefined) {
      // Validate that at least one category is provided
      if (!body.categoryIds || body.categoryIds.length === 0) {
        return errorResponse('At least one category is required', 400, 'VALIDATION_ERROR');
      }

      // Delete existing category associations
      await execute(env.DB, 'DELETE FROM photos_categories WHERE photo_id = ?', [photoId]);

      // Insert new category associations
      for (const categoryId of body.categoryIds) {
        await execute(env.DB, `
          INSERT INTO photos_categories (photo_id, category_id, created_at)
          VALUES (?, ?, ?)
        `, [photoId, categoryId, now]);
      }
    }

    // Return updated photo with categories
    const updated = await queryOne(env.DB, `
      SELECT 
        p.id, p.title, p.description, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at
      FROM photos p
      WHERE p.id = ?
    `, [photoId]);

    // Get categories for this photo (only active)
    const categories = await queryAll(env.DB, `
      SELECT c.id, c.name
      FROM categories c
      INNER JOIN photos_categories pc ON c.id = pc.category_id
      WHERE pc.photo_id = ?
        AND c.is_active = 1
    `, [photoId]);

    return successResponse({ 
      photo: {
        ...updated,
        categoryIds: categories.map((c: any) => c.id),
        categoryNames: categories.map((c: any) => c.name)
      } 
    });
  } catch (error: any) {
    console.error('Update photo error:', error);
    return errorResponse(`Failed to update photo: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
