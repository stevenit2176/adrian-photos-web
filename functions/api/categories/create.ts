/**
 * POST /api/categories/create
 * Create a new category (admin only)
 */

import { requireAdmin } from '../../lib/middleware';
import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';
import { execute } from '../../lib/db';

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;

    // Admin authentication required
    const user = await requireAdmin(request, env);

    const body = await request.json();
    const { name, slug, description, displayOrder, isActive, imageR2Key, imageAltText } = body;

    // Validation
    if (!name || !slug) {
      return errorResponse('Name and slug are required', 400, 'VALIDATION_ERROR');
    }

    // Check if slug already exists
    const existingCategory = await env.DB.prepare(
      'SELECT id FROM categories WHERE slug = ?'
    ).bind(slug).first();

    if (existingCategory) {
      return errorResponse('Category with this slug already exists', 400, 'DUPLICATE_SLUG');
    }

    // Generate ID
    const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert category
    await execute(env.DB, `
      INSERT INTO categories (
        id, name, slug, description, display_order, is_active,
        image_r2_key, image_alt_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      name,
      slug,
      description || null,
      displayOrder || 0,
      isActive !== false ? 1 : 0,
      imageR2Key || null,
      imageAltText || null
    ]);

    // Fetch the created category
    const category = await env.DB.prepare(`
      SELECT id, name, slug, description, display_order, is_active,
             image_r2_key, image_alt_text, created_at, updated_at
      FROM categories
      WHERE id = ?
    `).bind(id).first();

    return successResponse({
      category
    }, 201);
  } catch (error: any) {
    console.error('Create category error:', error);
    return errorResponse(`Failed to create category: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
