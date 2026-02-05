/**
 * POST /api/fulfillment/calculate
 * Calculate price for a frame configuration
 * Public endpoint
 */

import { calculateFramePrice } from '../../lib/frameiteasy';
import { successResponse, errorResponse } from '../../lib/utils';
import { Env } from '../../lib/types';

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context as { request: Request; env: Env };

    const body = await request.json() as {
      profile: string;
      color: string;
      width: number;
      height: number;
      cover?: string;
      backing?: string;
      outer_mat_type?: string;
      outer_mat_color?: string;
      outer_mat_thickness?: number;
      inner_mat_type?: string;
      inner_mat_color?: string;
      inner_mat_thickness?: number;
      image_url?: string;
    };

    // Validate required fields
    if (!body.profile || !body.color || !body.width || !body.height) {
      return errorResponse(
        'Missing required fields: profile, color, width, height',
        400,
        'VALIDATION_ERROR'
      );
    }

    const frameDetails = await calculateFramePrice(env, body);

    return successResponse({
      frame: frameDetails,
      message: 'Frame price calculated successfully'
    });
  } catch (error: any) {
    console.error('Calculate frame price error:', error);
    return errorResponse(
      `Failed to calculate frame price: ${error.message}`,
      500,
      'FRAMEITEASY_ERROR'
    );
  }
}
