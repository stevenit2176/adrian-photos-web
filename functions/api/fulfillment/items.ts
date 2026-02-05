/**
 * GET /api/fulfillment/items
 * Get all available frame styles, colors, mats, covers, and backings
 * Public endpoint
 */

import { getFrameItems } from '../../lib/frameiteasy';
import { successResponse, errorResponse } from '../../lib/utils';
import { Env } from '../../lib/types';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env } = context as { env: Env };

    console.log('[Items Endpoint] Starting getFrameItems call...');
    
    try {
      const items = await getFrameItems(env);
      console.log('[Items Endpoint] Success, items:', JSON.stringify(items).substring(0, 200));

      return successResponse({
        items,
        message: 'Frame items retrieved successfully'
      });
    } catch (apiError: any) {
      // If Frame It Easy API is down, return mock data
      console.warn('[Items Endpoint] Frame It Easy API unavailable, using mock data');
      
      const mockItems = {
        styles: [
          { id: 'classic-black', name: 'Classic Black', price: 29.99 },
          { id: 'modern-white', name: 'Modern White', price: 34.99 },
          { id: 'rustic-wood', name: 'Rustic Wood', price: 39.99 },
          { id: 'elegant-gold', name: 'Elegant Gold', price: 44.99 }
        ],
        colors: [
          { id: 'black', name: 'Black' },
          { id: 'white', name: 'White' },
          { id: 'natural', name: 'Natural Wood' },
          { id: 'gold', name: 'Gold' }
        ],
        mats: [
          { id: 'none', name: 'No Mat', price: 0 },
          { id: 'single-white', name: 'Single White Mat', price: 15.00 },
          { id: 'double-cream', name: 'Double Cream Mat', price: 25.00 }
        ],
        covers: [
          { id: 'none', name: 'No Cover', price: 0 },
          { id: 'acrylic', name: 'Acrylic', price: 20.00 },
          { id: 'museum-glass', name: 'Museum Glass', price: 50.00 }
        ],
        backings: [
          { id: 'standard', name: 'Standard Backing', price: 0 },
          { id: 'foam-core', name: 'Foam Core', price: 10.00 }
        ]
      };

      return successResponse({
        items: mockItems,
        message: 'Frame items retrieved (mock data - Frame It Easy API unavailable)'
      });
    }
  } catch (error: any) {
    console.error('[Items Endpoint] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return errorResponse(
      `Failed to retrieve frame items: ${error.message}`,
      500,
      'FRAMEITEASY_ERROR'
    );
  }
}
