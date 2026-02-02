-- Migration: Add image fields to categories table
-- Categories can have images for display in carousels and category cards

-- Add image fields to categories
ALTER TABLE categories ADD COLUMN image_r2_key TEXT;
ALTER TABLE categories ADD COLUMN image_alt_text TEXT;
