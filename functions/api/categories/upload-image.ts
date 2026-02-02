/**
 * POST /api/categories/upload-image
 * Upload a category image to R2 (admin only)
 */

import { requireAdmin } from '../../lib/middleware';
import { Env } from '../../lib/types';
import { successResponse, errorResponse } from '../../lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;

    // Admin authentication required
    const user = await requireAdmin(request, env);

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return errorResponse('No image file provided', 400, 'NO_FILE');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF',
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        'File size exceeds 10MB limit',
        400,
        'FILE_TOO_LARGE'
      );
    }

    // Generate unique key for R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const r2Key = `categories/${user.id}/${timestamp}-${randomStr}.${extension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await env.R2_BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return successResponse({
      r2Key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });
  } catch (error: any) {
    console.error('Upload category image error:', error);
    return errorResponse(`Failed to upload image: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
