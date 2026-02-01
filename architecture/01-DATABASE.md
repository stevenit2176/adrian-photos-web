# Database Architecture (MVP)

## Overview
Simplified database schema focusing on core e-commerce functionality.

## Tables (8 core tables)

### 1. users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'customer', -- customer, admin
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. categories
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. photos
```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  r2_key TEXT NOT NULL, -- original file in R2
  thumbnail_r2_key TEXT, -- thumbnail version
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### 4. product_types
```sql
CREATE TABLE product_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "Fine Art Print", "Canvas", "Metal Print"
  description TEXT,
  bay_photo_product_code TEXT, -- Bay Photo's product identifier
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0
);
```

### 5. product_sizes
```sql
CREATE TABLE product_sizes (
  id TEXT PRIMARY KEY,
  product_type_id TEXT NOT NULL,
  size_name TEXT NOT NULL, -- e.g., "8x10", "16x20"
  width_inches REAL,
  height_inches REAL,
  base_price REAL NOT NULL, -- in cents
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_type_id) REFERENCES product_types(id)
);
```

### 6. orders
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, cancelled
  subtotal INTEGER NOT NULL, -- in cents
  tax INTEGER DEFAULT 0,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  bay_photo_order_id TEXT,
  shipping_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'US',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7. order_items
```sql
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  product_type_id TEXT NOT NULL,
  product_size_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL, -- in cents
  total_price INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (photo_id) REFERENCES photos(id),
  FOREIGN KEY (product_type_id) REFERENCES product_types(id),
  FOREIGN KEY (product_size_id) REFERENCES product_sizes(id)
);
```

### 8. refresh_tokens
```sql
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Implementation Tasks

- [ ] Create migration file: `migrations/0001_initial_schema.sql`
- [ ] Create seed data file: `migrations/0002_seed_data.sql`
  - [ ] Seed admin user (email: admin@example.com)
  - [ ] Seed 3-4 categories
  - [ ] Seed product types (Fine Art Print, Canvas, Metal Print)
  - [ ] Seed product sizes for each type
- [ ] Set up D1 database in wrangler.toml
- [ ] Run migrations locally for testing
- [ ] Document database setup in README

## Notes
- Using TEXT for IDs (UUIDs generated in application)
- All prices stored in cents (INTEGER) to avoid floating point issues
- Timestamps in UTC
- Simplified for MVP - no user profiles, addresses tables, or activity logs
