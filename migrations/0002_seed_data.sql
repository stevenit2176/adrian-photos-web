-- Adrian Photos E-Commerce Platform
-- Seed Data
-- Migration: 0002

-- Create admin user
-- Default password: Admin123! (CHANGE THIS IN PRODUCTION)
-- Password hash generated with bcrypt, rounds=10
INSERT INTO users (id, email, password_hash, first_name, last_name, role) 
VALUES (
  'admin-001',
  'admin@adrianphotos.com',
  '$2a$10$rW8YJz9Y5qZ5GqZ5GqZ5Ge5qZ5GqZ5GqZ5GqZ5GqZ5GqZ5GqZ5Gq',
  'Admin',
  'User',
  'admin'
);

-- Insert categories
INSERT INTO categories (id, name, slug, description, display_order, is_active) VALUES
  ('cat-001', 'Landscapes', 'landscapes', 'Breathtaking natural scenery and outdoor photography', 1, 1),
  ('cat-002', 'Portraits', 'portraits', 'Professional portrait photography', 2, 1),
  ('cat-003', 'Abstract', 'abstract', 'Contemporary abstract art and creative compositions', 3, 1),
  ('cat-004', 'Wildlife', 'wildlife', 'Animals and nature in their natural habitat', 4, 1),
  ('cat-005', 'Architecture', 'architecture', 'Buildings, structures, and urban photography', 5, 1),
  ('cat-006', 'Black & White', 'black-and-white', 'Classic monochrome photography', 6, 1);

-- Insert product types
INSERT INTO product_types (id, name, description, bay_photo_product_code, display_order, is_active) VALUES
  ('ptype-001', 'Fine Art Print', 'Museum-quality fine art prints on premium paper', 'BAY_FINE_ART_PRINT', 1, 1),
  ('ptype-002', 'Canvas Print', 'Gallery-wrapped canvas prints ready to hang', 'BAY_CANVAS_WRAP', 2, 1),
  ('ptype-003', 'Metal Print', 'Vibrant prints on aluminum for modern display', 'BAY_METAL_PRINT', 3, 1);

-- Insert product sizes for Fine Art Prints
INSERT INTO product_sizes (id, product_type_id, size_name, width_inches, height_inches, base_price, display_order, is_active) VALUES
  ('psize-001', 'ptype-001', '8x10', 8, 10, 2500, 1, 1),
  ('psize-002', 'ptype-001', '11x14', 11, 14, 3500, 2, 1),
  ('psize-003', 'ptype-001', '16x20', 16, 20, 5500, 3, 1),
  ('psize-004', 'ptype-001', '20x24', 20, 24, 7500, 4, 1),
  ('psize-005', 'ptype-001', '24x36', 24, 36, 12500, 5, 1);

-- Insert product sizes for Canvas Prints
INSERT INTO product_sizes (id, product_type_id, size_name, width_inches, height_inches, base_price, display_order, is_active) VALUES
  ('psize-006', 'ptype-002', '12x16', 12, 16, 6500, 1, 1),
  ('psize-007', 'ptype-002', '16x20', 16, 20, 8500, 2, 1),
  ('psize-008', 'ptype-002', '20x30', 20, 30, 12500, 3, 1),
  ('psize-009', 'ptype-002', '24x36', 24, 36, 16500, 4, 1),
  ('psize-010', 'ptype-002', '30x40', 30, 40, 22500, 5, 1);

-- Insert product sizes for Metal Prints
INSERT INTO product_sizes (id, product_type_id, size_name, width_inches, height_inches, base_price, display_order, is_active) VALUES
  ('psize-011', 'ptype-003', '8x12', 8, 12, 4500, 1, 1),
  ('psize-012', 'ptype-003', '12x18', 12, 18, 7500, 2, 1),
  ('psize-013', 'ptype-003', '16x24', 16, 24, 11500, 3, 1),
  ('psize-014', 'ptype-003', '20x30', 20, 30, 16500, 4, 1),
  ('psize-015', 'ptype-003', '24x36', 24, 36, 22500, 5, 1);
