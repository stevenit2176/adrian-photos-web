/**
 * Global middleware for all Functions
 * Handles CORS, error handling, request logging, and image serving
 */

import { corsHeaders, handleCorsPreflightRequest, addCorsHeaders } from './lib/middleware';
import { getFromR2 } from './lib/r2';

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Only handle API routes and OPTIONS requests
  // Let everything else pass through to static files
  if (!url.pathname.startsWith('/api/')) {
    // Not an API route - pass through to static files
    return context.next();
  }
  
  // Handle image serving from R2
  if (url.pathname.startsWith('/api/photos/image/')) {
    try {
      // Extract the R2 key (everything after /api/photos/image/)
      const r2Key = url.pathname.substring('/api/photos/image/'.length);
      
      if (!r2Key) {
        const errorResponse = new Response(JSON.stringify({ error: 'Image path is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
        return addCorsHeaders(errorResponse);
      }

      console.log('Fetching image from R2:', r2Key);

      // Get the image from R2
      const object = await getFromR2(env.R2, r2Key);

      if (!object) {
        console.error('Image not found in R2:', r2Key);
        const notFoundResponse = new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
        return addCorsHeaders(notFoundResponse);
      }

      // Return the image with appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      
      if (object.httpEtag) {
        headers.set('ETag', object.httpEtag);
      }

      const imageResponse = new Response(object.body, { headers });
      return addCorsHeaders(imageResponse);
    } catch (error: any) {
      console.error('Serve image error:', error);
      const errorResponse = new Response(JSON.stringify({ error: `Failed to serve image: ${error.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
      return addCorsHeaders(errorResponse);
    }
  }
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  // Log request in development
  if (env.ENVIRONMENT === 'development') {
    console.log(`${request.method} ${url.pathname}`);
  }
  
  try {
    // Continue to the actual handler
    const response = await context.next();
    
    // Add CORS headers to response
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Global middleware error:', error);
    
    // Return error response with CORS headers
    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'SERVER_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      }
    );
    
    return errorResponse;
  }
}
