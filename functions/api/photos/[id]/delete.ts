/**
 * DELETE /api/photos/:id
 * Delete a photo and its R2 file
 * Requires admin role
 */

import { requireAdmin } from '../../../lib/middleware';
import { Env } from '../../../lib/types';
import { successResponse, errorResponse } from '../../../lib/utils';
import { execute, queryOne } from '../../../lib/db';
import { deleteFromR2 } from '../../../lib/r2';

export async function onRequestDelete(context: any): Promise<Response> {
  try {
    const { request, params, env } = context;

    // Require admin authentication
    await requireAdmin(request, env);

    const photoId = params.id;

    if (!photoId) {
      return errorResponse('Photo ID is required', 400, 'VALIDATION_ERROR');
    }

    // Get photo to find R2 key
    const photo = await queryOne(env.DB, 'SELECT id, r2_key FROM photos WHERE id = ?', [photoId]);
    
    if (!photo) {
      return errorResponse('Photo not found', 404, 'NOT_FOUND');
    }

    // Delete from R2
    if (photo.r2_key) {
      await deleteFromR2(env.R2, photo.r2_key);
    }

    // Delete from database
    await execute(env.DB, 'DELETE FROM photos WHERE id = ?', [photoId]);

    return successResponse({
      message: 'Photo deleted successfully',
      photoId,
    });
  } catch (error: any) {
    console.error('Delete photo error:', error);
    return errorResponse(`Failed to delete photo: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
