/**
 * R2 Storage utilities
 * Handle photo uploads and management in Cloudflare R2
 */

import { Env } from './types';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  file: ArrayBuffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  await r2.put(key, file, {
    httpMetadata: {
      contentType,
    },
    customMetadata: metadata,
  });

  return {
    key,
    url: `/photos/${key}`,
    size: file.byteLength,
    contentType,
  };
}

/**
 * Get a file from R2
 */
export async function getFromR2(
  r2: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return await r2.get(key);
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(
  r2: R2Bucket,
  key: string
): Promise<void> {
  await r2.delete(key);
}

/**
 * List files in R2 with prefix
 */
export async function listFromR2(
  r2: R2Bucket,
  prefix?: string,
  limit: number = 1000
): Promise<R2Objects> {
  return await r2.list({
    prefix,
    limit,
  });
}

/**
 * Generate a unique filename for photo upload
 */
export function generatePhotoKey(
  originalFilename: string,
  userId: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  return `photos/${userId}/${timestamp}-${randomStr}.${ext}`;
}

/**
 * Generate thumbnail key from photo key
 */
export function getThumbnailKey(photoKey: string): string {
  const parts = photoKey.split('.');
  const ext = parts.pop();
  return `${parts.join('.')}-thumb.${ext}`;
}

/**
 * Validate image file type
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  return validTypes.includes(contentType.toLowerCase());
}

/**
 * Validate image file size (max 10MB)
 */
export function isValidImageSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}
