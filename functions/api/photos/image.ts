/**
 * GET /api/photos/image/:key
 * Serve photo images from R2 storage
 * Public endpoint with caching headers
 * 
 * Note: The key parameter should be URL-encoded if it contains slashes
 * Example: /api/photos/image/photos%2Fadmin-001%2F1234.jpg
 */

import { getFromR2 } from '../../lib/r2';
import { errorResponse } from '../../lib/utils';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    
    const url = new URL(request.url);
    
    // Support both query parameter (?key=...) and path-based (/api/photos/image/key) formats
    let r2Key = url.searchParams.get('key');
    
    if (!r2Key) {
      // Try path-based format
      const pathMatch = url.pathname.match(/\/api\/photos\/image\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        r2Key = decodeURIComponent(pathMatch[1]);
      }
    }
    
    if (!r2Key) {
      return errorResponse('Image path is required', 400, 'INVALID_REQUEST');
    }

    // Get the image from R2
    const object = await getFromR2(env.R2, r2Key);

    if (!object) {
      return errorResponse('Image not found', 404, 'NOT_FOUND');
    }

    // Return the image with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, {
      headers,
      status: 200,
    });
  } catch (error: any) {
    console.error('Serve image error:', error);
    return errorResponse(`Failed to serve image: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
