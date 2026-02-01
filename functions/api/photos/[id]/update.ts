/**
 * PUT /api/photos/:id
 * Update a photo's metadata
 * Requires admin role
 */

import { requireAdmin } from '../../../lib/middleware';
import { Env } from '../../../lib/types';
import { successResponse, errorResponse, parseJsonBody } from '../../../lib/utils';
import { execute, queryOne } from '../../../lib/db';

interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  categoryId?: string;
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
    if (body.categoryId !== undefined) {
      updates.push('category_id = ?');
      sqlParams.push(body.categoryId);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      sqlParams.push(body.price);
    }
    if (body.isActive !== undefined) {
      updates.push('is_active = ?');
      sqlParams.push(body.isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400, 'VALIDATION_ERROR');
    }

    updates.push('updated_at = ?');
    sqlParams.push(new Date().toISOString());
    sqlParams.push(photoId);

    await execute(
      env.DB,
      `UPDATE photos SET ${updates.join(', ')} WHERE id = ?`,
      sqlParams
    );

    // Return updated photo
    const updated = await queryOne(env.DB, `
      SELECT 
        p.id, p.title, p.description, p.category_id, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at,
        c.name as category_name
      FROM photos p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [photoId]);

    return successResponse({ photo: updated });
  } catch (error: any) {
    console.error('Update photo error:', error);
    return errorResponse(`Failed to update photo: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
