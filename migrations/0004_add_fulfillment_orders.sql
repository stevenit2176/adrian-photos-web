-- Migration: Add fulfillment columns to orders table
-- Date: 2026-02-03

-- Add Frame It Easy columns to existing orders table
ALTER TABLE orders ADD COLUMN frameiteasy_order_id TEXT;
ALTER TABLE orders ADD COLUMN frameiteasy_order_number TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_frameiteasy_order_id ON orders(frameiteasy_order_id);

-- Order items table (for Frame It Easy SKUs)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_photo_id ON order_items(photo_id);
