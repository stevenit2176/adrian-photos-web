/**
 * Global middleware for all Functions
 * Handles CORS, error handling, and request logging
 */

import { corsHeaders, handleCorsPreflightRequest, addCorsHeaders } from './lib/middleware';

export async function onRequest(context: any): Promise<Response> {
  const { request } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  // Log request in development
  if (context.env.ENVIRONMENT === 'development') {
    console.log(`${request.method} ${new URL(request.url).pathname}`);
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
