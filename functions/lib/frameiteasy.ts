/**
 * Frame It Easy API Client
 * https://documenter.getpostman.com/view/7462304/Tz5s3bQB
 */

import { Env, FrameItEasyItem, FrameItEasyItemsResponse, FrameItEasyOrder } from './types';

/**
 * Make authenticated request to Frame It Easy API
 */
async function frameItEasyRequest(
  env: Env,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  // Use environment variables with fallback to sandbox for testing
  const apiUrl = env.FRAMEITEASY_API_URL || 'https://api.sandbox.frameiteasy.com';
  const apiKey = env.FRAMEITEASY_API_KEY || 'sandbox@frameiteasy.com:0Az9*MtXQo';
  
  const url = `${apiUrl}/v1${endpoint}`;
  
  // Encode credentials for Basic Auth (btoa is available in Cloudflare Workers)
  const base64Credentials = btoa(apiKey);
  
  console.log('[FrameItEasy] Request:', method, url);
  console.log('[FrameItEasy] API Key exists:', !!apiKey);
  console.log('[FrameItEasy] Base64 length:', base64Credentials.length);
  
  const headers: Record<string, string> = {
    'Authorization': `Basic ${base64Credentials}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log('[FrameItEasy] Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FrameItEasy] Error:', response.status, errorText);
    throw new Error(`Frame It Easy API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Get all available frame items (styles, colors, mats, covers, backings)
 */
export async function getFrameItems(env: Env): Promise<FrameItEasyItemsResponse> {
  return await frameItEasyRequest(env, '/items', 'GET');
}

/**
 * Calculate price for a frame configuration
 */
export async function calculateFramePrice(
  env: Env,
  config: {
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
  }
): Promise<FrameItEasyItem> {
  return await frameItEasyRequest(env, '/items', 'POST', config);
}

/**
 * Get frame details by SKU
 */
export async function getFrameBySku(env: Env, sku: string): Promise<FrameItEasyItem> {
  return await frameItEasyRequest(env, '/items', 'POST', { sku });
}

/**
 * Create an order with Frame It Easy
 */
export async function createFrameOrder(
  env: Env,
  orderData: {
    items: Array<{
      sku: string;
      quantity: number;
      image_url?: string;
    }>;
    shipping: {
      first_name: string;
      last_name: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
      phone?: string;
      email: string;
    };
  }
): Promise<FrameItEasyOrder> {
  return await frameItEasyRequest(env, '/orders', 'POST', orderData);
}

/**
 * Get order details by ID
 */
export async function getFrameOrder(env: Env, orderId: string): Promise<FrameItEasyOrder> {
  return await frameItEasyRequest(env, `/orders/${orderId}`, 'GET');
}

/**
 * Get all orders
 */
export async function getFrameOrders(env: Env): Promise<FrameItEasyOrder[]> {
  const response = await frameItEasyRequest(env, '/orders', 'GET');
  return response.orders || [];
}

/**
 * Upload an image to Frame It Easy
 * Note: Alternatively, you can provide image URLs directly in the order
 */
export async function uploadImageToFrameItEasy(
  env: Env,
  imageFile: File
): Promise<{ file_name: string; image_url: string }> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${env.FRAMEITEASY_API_URL}/v1/upload`, {
    method: 'POST',
    headers: {
      'Authorization': env.FRAMEITEASY_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image upload failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Register image URL with Frame It Easy (preferred method)
 */
export async function registerImageUrl(
  env: Env,
  imageUrl: string
): Promise<{ success: boolean; image_url: string }> {
  return await frameItEasyRequest(env, '/image-urls', 'POST', {
    image_url: imageUrl
  });
}
