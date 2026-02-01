-- Add missing photo metadata columns
-- Migration: 0003

-- Add file_size, mime_type, price, and uploaded_by columns to photos table
ALTER TABLE photos ADD COLUMN file_size INTEGER;
ALTER TABLE photos ADD COLUMN mime_type TEXT;
ALTER TABLE photos ADD COLUMN price REAL;
ALTER TABLE photos ADD COLUMN uploaded_by TEXT REFERENCES users(id);

-- Create index on uploaded_by for performance
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
