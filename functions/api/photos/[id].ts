/**
 * GET /api/photos/:id
 * Get a single photo by ID
 * Public endpoint - shows only active photos for non-admin users
 */

import { optionalAuth } from '../../lib/middleware';
import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';
import { queryOne } from '../../lib/db';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, params, env } = context;

    // Optional auth - allows both authenticated and anonymous users
    const user = await optionalAuth(request, env);
    const isAdmin = user?.role === 'admin';
    const photoId = params.id;

    if (!photoId) {
      return errorResponse('Photo ID is required', 400, 'VALIDATION_ERROR');
    }

    let sql = `
      SELECT 
        p.id, p.title, p.description, p.category_id, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at,
        c.name as category_name, c.slug as category_slug,
        u.email as uploaded_by_email
      FROM photos p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.id = ?
    `;

    const sqlParams = [photoId];

    // Non-admin users can only see active photos
    if (!isAdmin) {
      sql += ' AND p.is_active = 1';
    }

    const photo = await queryOne(env.DB, sql, sqlParams);

    if (!photo) {
      return errorResponse('Photo not found', 404, 'NOT_FOUND');
    }

    return successResponse({ photo });
  } catch (error: any) {
    console.error('Get photo error:', error);
    return errorResponse(`Failed to get photo: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
