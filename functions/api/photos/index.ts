/**
 * GET /api/photos
 * List all photos with optional filtering
 * Public endpoint - shows only active photos for non-admin users
 */

import { optionalAuth } from '../../lib/middleware';
import { Env } from '../../lib/types';
import { successResponse, errorResponse, getQueryParams, paginate } from '../../lib/utils';
import { query } from '../../lib/db';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;

    // Optional auth - allows both authenticated and anonymous users
    const user = await optionalAuth(request, env);
    const isAdmin = user?.role === 'admin';

    const params = getQueryParams(request);
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    const categoryId = params.get('categoryId') || undefined;
    const search = params.get('search') || undefined;

    // Build query
    let sql = `
      SELECT 
        p.id, p.title, p.description, p.category_id, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at,
        c.name as category_name, c.slug as category_slug
      FROM photos p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    const sqlParams: any[] = [];

    // Non-admin users can only see active photos
    if (!isAdmin) {
      sql += ' AND p.is_active = 1';
    }

    // Filter by category
    if (categoryId) {
      sql += ' AND p.category_id = ?';
      sqlParams.push(categoryId);
    }

    // Search by title or description
    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      sqlParams.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY p.created_at DESC';

    // Get paginated results
    const photos = await query(env.DB, sql, sqlParams);
    const paginationResult = paginate(photos, page, limit);

    return successResponse({
      photos: paginationResult.items,
      pagination: {
        page: paginationResult.page,
        limit,
        total: paginationResult.total,
        totalPages: paginationResult.pages,
      },
    });
  } catch (error: any) {
    console.error('List photos error:', error);
    return errorResponse(`Failed to list photos: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
