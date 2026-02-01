/**
 * POST /api/photos/upload
 * Upload a photo to R2 storage and create database record
 * Requires authentication and admin role
 */

import { requireAdmin } from '../../lib/middleware';
import { Env } from '../../lib/types';
import { successResponse, errorResponse, generateId } from '../../lib/utils';
import { uploadToR2, generatePhotoKey, isValidImageType, isValidImageSize } from '../../lib/r2';
import { execute } from '../../lib/db';

interface PhotoUploadData {
  title: string;
  description?: string;
  categoryId: string;
  price?: number;
  isActive?: boolean;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;

    // Require admin authentication
    const user = await requireAdmin(request, env);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const categoryId = formData.get('categoryId') as string;
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
    const isActive = formData.get('isActive') !== 'false'; // Default to true

    // Validate file
    if (!file) {
      return errorResponse('No file uploaded', 400, 'VALIDATION_ERROR');
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return errorResponse('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.', 400, 'VALIDATION_ERROR');
    }

    // Validate file size
    if (!isValidImageSize(file.size)) {
      return errorResponse('File too large. Maximum size is 10MB.', 400, 'VALIDATION_ERROR');
    }

    // Validate required fields
    if (!title || !categoryId) {
      return errorResponse('Title and category are required', 400, 'VALIDATION_ERROR');
    }

    // Generate unique key for R2
    const photoKey = generatePhotoKey(file.name, user.userId);

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await uploadToR2(
      env.R2,
      photoKey,
      arrayBuffer,
      file.type,
      {
        uploadedBy: user.userId,
        uploadedAt: new Date().toISOString(),
      }
    );

    // Create database record
    const photoId = generateId();
    const now = new Date().toISOString();

    await execute(env.DB, `
      INSERT INTO photos (
        id, title, description, category_id, r2_key, file_size, 
        mime_type, price, is_active, uploaded_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      photoId,
      title,
      description || null,
      categoryId,
      uploadResult.key,
      uploadResult.size,
      uploadResult.contentType,
      price || null,
      isActive ? 1 : 0,
      user.userId,
      now,
      now,
    ]);

    return successResponse({
      photo: {
        id: photoId,
        title,
        description,
        categoryId,
        r2Key: uploadResult.key,
        fileSize: uploadResult.size,
        mimeType: uploadResult.contentType,
        price,
        isActive,
        uploadedBy: user.userId,
        createdAt: now,
      },
    }, 201);
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return errorResponse(`Upload failed: ${error.message}`, 500, 'SERVER_ERROR');
  }
}
