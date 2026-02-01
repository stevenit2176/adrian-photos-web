/**
 * GET /api/health
 * Health check endpoint to verify environment configuration
 */

export async function onRequestGet(context: any): Promise<Response> {
  const { env } = context;
  
  const healthData = {
    success: true,
    data: {
      status: 'healthy',
      environment: env.ENVIRONMENT || 'unknown',
      hasJwtSecret: !!env.JWT_SECRET,
      jwtSecretLength: env.JWT_SECRET ? env.JWT_SECRET.length : 0,
      hasDatabase: !!env.DB,
      hasR2: !!env.R2,
      jwtAccessExpiry: env.JWT_ACCESS_EXPIRY || 'not set',
      jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY || 'not set',
    }
  };
  
  return new Response(JSON.stringify(healthData), {
    headers: { 'Content-Type': 'application/json' }
  });
}
