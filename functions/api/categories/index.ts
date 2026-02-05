/**
 * GET /api/categories
 * Get categories (active only by default, include inactive with ?includeInactive=true)
 */

import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';
import { getCategories } from '../../lib/db';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env, request } = context;
    
    // Check for includeInactive query parameter
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    // Get categories based on includeInactive parameter
    const categories = await getCategories(env.DB, includeInactive);

    return successResponse({
      categories,
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return errorResponse('Failed to get categories', 500, 'SERVER_ERROR');
  }
}
