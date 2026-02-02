/**
 * POST /api/photos/upload
 * Upload a photo to R2 storage and create database record
 * Requires authentication and admin role
 */

import { requireAdmin } from '../../lib/middleware';
import { Env } from '../../lib/types';
import { successResponse, errorResponse, generateId } from '../../lib/utils';
import { uploadToR2, generatePhotoKey, isValidImageType, isValidImageSize, deleteFromR2 } from '../../lib/r2';
import { execute, queryOne } from '../../lib/db';

interface PhotoUploadData {
  title: string;
  description?: string;
  categoryIds: string[];
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
    const categoryIdsStr = formData.get('categoryIds') as string;
    const categoryIds = categoryIdsStr ? JSON.parse(categoryIdsStr) : [];
    const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null;
    const isActive = formData.get('isActive') !== 'false'; // Default to true
    const replacePhotoId = formData.get('replacePhotoId') as string | null; // For replacing existing photo

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
    if (!title || !categoryIds || categoryIds.length === 0) {
      return errorResponse('Title and at least one category are required', 400, 'VALIDATION_ERROR');
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

    const now = new Date().toISOString();

    // If replacing an existing photo, update it instead of creating new
    if (replacePhotoId) {
      // Get old photo to delete old R2 file
      const oldPhoto = await queryOne(env.DB, 'SELECT r2_key FROM photos WHERE id = ?', [replacePhotoId]);
      
      if (oldPhoto) {
        // Delete old file from R2
        try {
          await deleteFromR2(env.R2, oldPhoto.r2_key);
        } catch (err) {
          console.error('Failed to delete old R2 file:', err);
          // Continue anyway - new file is uploaded
        }

        // Update existing photo record
        await execute(env.DB, `
          UPDATE photos 
          SET title = ?, description = ?, r2_key = ?, 
              file_size = ?, mime_type = ?, price = ?, is_active = ?, updated_at = ?
          WHERE id = ?
        `, [
          title,
          description || null,
          uploadResult.key,
          uploadResult.size,
          uploadResult.contentType,
          price || null,
          isActive ? 1 : 0,
          now,
          replacePhotoId,
        ]);

        // Delete existing category associations
        await execute(env.DB, 'DELETE FROM photos_categories WHERE photo_id = ?', [replacePhotoId]);

        // Insert new category associations
        for (const categoryId of categoryIds) {
          await execute(env.DB, `
            INSERT INTO photos_categories (photo_id, category_id, created_at)
            VALUES (?, ?, ?)
          `, [replacePhotoId, categoryId, now]);
        }

        return successResponse({
          photo: {
            id: replacePhotoId,
            title,
            description,
            categoryIds,
            r2Key: uploadResult.key,
            fileSize: uploadResult.size,
            mimeType: uploadResult.contentType,
            price,
            isActive,
            updatedAt: now,
          },
        });
      }
    }

    // Create new database record
    const photoId = generateId();

    await execute(env.DB, `
      INSERT INTO photos (
        id, title, description, r2_key, file_size, 
        mime_type, price, is_active, uploaded_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      photoId,
      title,
      description || null,
      uploadResult.key,
      uploadResult.size,
      uploadResult.contentType,
      price || null,
      isActive ? 1 : 0,
      user.userId,
      now,
      now,
    ]);

    // Insert category associations
    for (const categoryId of categoryIds) {
      await execute(env.DB, `
        INSERT INTO photos_categories (photo_id, category_id, created_at)
        VALUES (?, ?, ?)
      `, [photoId, categoryId, now]);
    }

    return successResponse({
      photo: {
        id: photoId,
        title,
        description,
        categoryIds,
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
