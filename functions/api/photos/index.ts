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
        p.id, p.title, p.description, p.r2_key,
        p.file_size, p.mime_type, p.price, p.is_active,
        p.uploaded_by, p.created_at, p.updated_at
      FROM photos p
      WHERE 1=1
    `;

    const sqlParams: any[] = [];

    // Non-admin users can only see active photos
    if (!isAdmin) {
      sql += ' AND p.is_active = 1';
    }

    // Filter by category
    if (categoryId) {
      sql += ` AND EXISTS (
        SELECT 1 FROM photos_categories pc 
        WHERE pc.photo_id = p.id AND pc.category_id = ?
      )`;
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
    
    // Get categories for each photo
    const photoIds = photos.map((p: any) => p.id);
    const categoriesMap = new Map<string, any[]>();
    
    if (photoIds.length > 0) {
      const placeholders = photoIds.map(() => '?').join(',');
      const categoriesResult = await query(env.DB, `
        SELECT pc.photo_id, c.id, c.name, c.slug
        FROM photos_categories pc
        INNER JOIN categories c ON pc.category_id = c.id
        WHERE pc.photo_id IN (${placeholders})
          AND c.is_active = 1
        ORDER BY c.name
      `, photoIds);
      
      for (const cat of categoriesResult) {
        // Note: query() converts photo_id to photoId via toCamelCase
        if (!categoriesMap.has(cat.photoId)) {
          categoriesMap.set(cat.photoId, []);
        }
        categoriesMap.get(cat.photoId)!.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        });
      }
    }
    
    // Add categories to photos
    const photosWithCategories = photos.map((photo: any) => ({
      ...photo,
      categoryIds: (categoriesMap.get(photo.id) || []).map((c: any) => c.id),
      categoryNames: (categoriesMap.get(photo.id) || []).map((c: any) => c.name),
      categorySlugs: (categoriesMap.get(photo.id) || []).map((c: any) => c.slug)
    }));
    
    const paginationResult = paginate(photosWithCategories, page, limit);

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
