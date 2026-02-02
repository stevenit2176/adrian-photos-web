-- Migration: Add photos_categories junction table for many-to-many relationship
-- Date: 2026-02-02

-- Create junction table for photos and categories
CREATE TABLE IF NOT EXISTS photos_categories (
  photo_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (photo_id, category_id),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_categories_photo_id ON photos_categories(photo_id);
CREATE INDEX IF NOT EXISTS idx_photos_categories_category_id ON photos_categories(category_id);

-- Migrate existing data from photos.category_id to photos_categories
INSERT INTO photos_categories (photo_id, category_id, created_at)
SELECT id, category_id, created_at
FROM photos
WHERE category_id IS NOT NULL;

-- Remove category_id column from photos table (SQLite doesn't support DROP COLUMN easily)
-- Instead, we'll create a new table without the column and copy data
CREATE TABLE photos_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  price INTEGER,
  is_active INTEGER DEFAULT 1,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Copy data from old table to new table
INSERT INTO photos_new (id, title, description, r2_key, file_size, mime_type, price, is_active, uploaded_by, created_at, updated_at)
SELECT id, title, description, r2_key, file_size, mime_type, price, is_active, uploaded_by, created_at, updated_at
FROM photos;

-- Drop old table and rename new table
DROP TABLE photos;
ALTER TABLE photos_new RENAME TO photos;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_is_active ON photos(is_active);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
