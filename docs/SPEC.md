# Adrian Photos Web - Technical Specification

## Project Overview

A photography website built on Angular 21 with Cloudflare Pages, D1 database, and R2 storage. The platform allows users to browse photo galleries, select prints, and place orders through Bay Photo's fulfillment API with Stripe payment processing.

**Live URL:** https://photos.ssmithrentals.com

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Authentication System](#3-authentication-system)
4. [Photo Management](#4-photo-management)
5. [Category & Gallery System](#5-category--gallery-system)
6. [Product & Pricing System](#6-product--pricing-system)
7. [Order System](#7-order-system)
8. [Payment Integration](#8-payment-integration)
9. [Bay Photo API Integration](#9-bay-photo-api-integration)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Email System](#11-email-system)
12. [Analytics](#12-analytics)
13. [API Endpoints](#13-api-endpoints)
14. [Frontend Components](#14-frontend-components)
15. [Security Considerations](#15-security-considerations)
16. [Local Development Setup](#16-local-development-setup)
17. [Deployment](#17-deployment)
18. [Future Considerations](#18-future-considerations)

---

## 1. Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21 (Standalone Components) |
| Styling | Angular Material 21, SCSS, Google Fonts (Prata, Barlow) |
| Backend | Cloudflare Pages Functions (Edge Workers) |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 |
| Authentication | JWT Tokens |
| Payments | Stripe |
| Fulfillment | Bay Photo API |
| Email | Resend |
| Analytics | Google Analytics + Custom Analytics |

### Project Structure

```
adrian-photos-web/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services, guards, interceptors
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── cart.service.ts
│   │   │   │   ├── photo.service.ts
│   │   │   │   └── order.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── admin.guard.ts
│   │   │   └── interceptors/
│   │   │       └── auth.interceptor.ts
│   │   ├── shared/                  # Shared components, pipes, directives
│   │   │   ├── components/
│   │   │   └── pipes/
│   │   ├── features/                # Feature modules
│   │   │   ├── gallery/
│   │   │   ├── photo-detail/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── order-tracking/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   ├── account/
│   │   │   │   ├── profile/
│   │   │   │   └── order-history/
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── photos/
│   │   │       ├── categories/
│   │   │       ├── galleries/
│   │   │       ├── products/
│   │   │       ├── orders/
│   │   │       ├── users/
│   │   │       ├── analytics/
│   │   │       ├── bay-photo/
│   │   │       └── settings/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── assets/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── functions/                       # Cloudflare Pages Functions
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   ├── refresh.ts
│   │   │   ├── forgot-password.ts
│   │   │   └── reset-password.ts
│   │   ├── photos/
│   │   │   ├── index.ts             # GET all, POST create
│   │   │   └── [id].ts              # GET, PUT, DELETE single
│   │   ├── categories/
│   │   ├── galleries/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── webhooks/
│   │   │   └── stripe.ts
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── analytics/
│   │   │   └── bay-photo/
│   │   └── upload/
│   │       └── image.ts
│   ├── lib/
│   │   ├── db.ts                    # D1 database utilities
│   │   ├── r2.ts                    # R2 storage utilities
│   │   ├── auth.ts                  # JWT utilities
│   │   ├── stripe.ts                # Stripe utilities
│   │   ├── bay-photo.ts             # Bay Photo API client
│   │   ├── resend.ts                # Email utilities
│   │   └── middleware.ts            # Auth middleware
│   └── _middleware.ts               # Global middleware
├── migrations/                      # D1 database migrations
│   ├── 0001_initial_schema.sql
│   ├── 0002_seed_admin.sql
│   └── ...
├── wrangler.toml                    # Cloudflare configuration
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 2. Database Schema

All migrations stored in `/migrations/` folder.

### Migration 0001: Initial Schema

```sql
-- migrations/0001_initial_schema.sql

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1,
    email_verified INTEGER NOT NULL DEFAULT 0,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- =============================================
-- CATEGORIES (Parent-Child Structure)
-- =============================================

CREATE TABLE categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- =============================================
-- GALLERIES
-- =============================================

CREATE TABLE galleries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_featured INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_galleries_slug ON galleries(slug);
CREATE INDEX idx_galleries_active ON galleries(is_active);
CREATE INDEX idx_galleries_featured ON galleries(is_featured);

-- =============================================
-- PHOTOS
-- =============================================

CREATE TABLE photos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    display_order INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    order_count INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_order_count ON photos(order_count DESC);
CREATE INDEX idx_photos_view_count ON photos(view_count DESC);

-- Photo Tags
CREATE TABLE tags (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE photo_tags (
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (photo_id, tag_id)
);

-- Photo-Category Many-to-Many
CREATE TABLE photo_categories (
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (photo_id, category_id)
);

CREATE INDEX idx_photo_categories_category ON photo_categories(category_id);

-- Photo-Gallery Many-to-Many
CREATE TABLE photo_galleries (
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (photo_id, gallery_id)
);

CREATE INDEX idx_photo_galleries_gallery ON photo_galleries(gallery_id);

-- =============================================
-- FEATURED/SUGGESTED PHOTOS
-- =============================================

CREATE TABLE featured_photos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('homepage', 'suggested', 'popular')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_auto_generated INTEGER NOT NULL DEFAULT 0,  -- For auto-calculated popular photos
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_featured_photos_type ON featured_photos(feature_type);
CREATE UNIQUE INDEX idx_featured_photos_unique ON featured_photos(photo_id, feature_type);

-- =============================================
-- PRODUCTS & PRICING
-- =============================================

CREATE TABLE product_types (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,                    -- e.g., "Print", "Canvas", "Framed"
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE product_sizes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    product_type_id TEXT NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                    -- e.g., "8x10", "16x20"
    width REAL NOT NULL,                   -- inches
    height REAL NOT NULL,                  -- inches
    price REAL NOT NULL,                   -- Fixed price in USD
    bay_photo_product_id INTEGER,          -- Mapped Bay Photo product ID
    is_active INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_product_sizes_type ON product_sizes(product_type_id);

-- Bay Photo Products Cache (fetched from API)
CREATE TABLE bay_photo_products (
    id INTEGER PRIMARY KEY,                -- Bay Photo's product ID
    name TEXT NOT NULL,
    price REAL NOT NULL,
    print_size_x REAL,
    print_size_y REAL,
    square_inch REAL,
    last_synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bay Photo Services Cache
CREATE TABLE bay_photo_services (
    id INTEGER PRIMARY KEY,                -- Bay Photo's service ID
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    last_synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================
-- ORDERS
-- =============================================

CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_number TEXT UNIQUE NOT NULL,     -- Human-readable order number
    order_guid TEXT UNIQUE NOT NULL,       -- GUID for guest order tracking
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,

    -- Customer Info (stored for guests and logged-in users)
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,

    -- Shipping Address
    shipping_address1 TEXT NOT NULL,
    shipping_address2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_country TEXT NOT NULL DEFAULT 'USA',
    shipping_zip TEXT NOT NULL,

    -- Pricing
    subtotal REAL NOT NULL,
    shipping_cost REAL NOT NULL DEFAULT 0,
    tax REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Order created, awaiting payment
        'paid',              -- Payment received
        'submitted',         -- Submitted to Bay Photo
        'processing',        -- Bay Photo processing
        'shipped',           -- Shipped from Bay Photo
        'delivered',         -- Delivered to customer
        'cancelled'          -- Order cancelled
    )),

    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,

    -- Bay Photo
    bay_photo_order_id TEXT,
    bay_photo_order_name TEXT,

    -- Shipping Tracking
    shipping_carrier TEXT,
    shipping_tracking_number TEXT,
    shipping_method TEXT,
    estimated_delivery_date TEXT,
    shipped_at TEXT,
    delivered_at TEXT,

    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT,
    submitted_to_bay_photo_at TEXT,
    cancelled_at TEXT
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_guid ON orders(order_guid);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE TABLE order_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE RESTRICT,
    product_size_id TEXT NOT NULL REFERENCES product_sizes(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,

    -- Bay Photo specific fields
    bay_photo_product_id INTEGER,
    crop_x REAL,
    crop_y REAL,
    crop_width REAL,
    crop_height REAL,
    rotation INTEGER DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_photo ON order_items(photo_id);

-- Order Status History
CREATE TABLE order_status_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- =============================================
-- SHOPPING CART (For logged-in users persistence)
-- =============================================

CREATE TABLE cart_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    product_size_id TEXT NOT NULL REFERENCES product_sizes(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, photo_id, product_size_id)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- =============================================
-- ANALYTICS
-- =============================================

CREATE TABLE page_views (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    page_path TEXT NOT NULL,
    photo_id TEXT REFERENCES photos(id) ON DELETE SET NULL,
    gallery_id TEXT REFERENCES galleries(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_hash TEXT,                          -- Hashed IP for privacy
    user_agent TEXT,
    referrer TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_page_views_path ON page_views(page_path);
CREATE INDEX idx_page_views_photo ON page_views(photo_id);
CREATE INDEX idx_page_views_created ON page_views(created_at);

CREATE TABLE analytics_daily (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    date TEXT NOT NULL,
    total_page_views INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_revenue REAL NOT NULL DEFAULT 0,
    UNIQUE(date)
);

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);

-- =============================================
-- SYSTEM SETTINGS
-- =============================================

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
    ('site_name', 'Adrian Photos', 'Website name'),
    ('site_description', 'Professional photography prints and wall art', 'Site meta description'),
    ('contact_email', 'contact@example.com', 'Contact email address'),
    ('popular_photos_mode', 'manual', 'Mode for popular photos: manual or auto'),
    ('popular_photos_auto_count', '10', 'Number of auto-generated popular photos'),
    ('bay_photo_configured', 'false', 'Whether Bay Photo API is configured'),
    ('stripe_configured', 'false', 'Whether Stripe is configured'),
    ('google_analytics_id', '', 'Google Analytics measurement ID');
```

### Migration 0002: Seed Admin

```sql
-- migrations/0002_seed_admin.sql

-- Password: smith007
-- Salt and hash generated using bcrypt
-- Note: In production, generate these values programmatically

INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    password_salt,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'admin-seed-001',
    'stevenit2176@gmail.com',
    'stevenit',
    -- This will be generated during setup: bcrypt hash of 'smith007' with salt
    '$HASH_PLACEHOLDER$',
    '$SALT_PLACEHOLDER$',
    'admin',
    1,
    1,
    datetime('now'),
    datetime('now')
);
```

---

## 3. Authentication System

### JWT Token Strategy

**Access Token:**
- Short-lived: 15 minutes
- Contains: user ID, email, role
- Stored in memory (not localStorage)

**Refresh Token:**
- Long-lived: 7 days
- Stored in httpOnly cookie
- Hashed in database

### Password Security

```typescript
// functions/lib/auth.ts

import { webcrypto } from 'crypto';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const ALGORITHM = 'PBKDF2';

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = webcrypto.getRandomValues(new Uint8Array(32));
    const saltHex = Buffer.from(salt).toString('hex');

    const encoder = new TextEncoder();
    const keyMaterial = await webcrypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        ALGORITHM,
        false,
        ['deriveBits']
    );

    const derivedBits = await webcrypto.subtle.deriveBits(
        {
            name: ALGORITHM,
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-512'
        },
        keyMaterial,
        KEY_LENGTH * 8
    );

    const hashHex = Buffer.from(derivedBits).toString('hex');

    return { hash: hashHex, salt: saltHex };
}

export async function verifyPassword(
    password: string,
    storedHash: string,
    storedSalt: string
): Promise<boolean> {
    const salt = Buffer.from(storedSalt, 'hex');

    const encoder = new TextEncoder();
    const keyMaterial = await webcrypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        ALGORITHM,
        false,
        ['deriveBits']
    );

    const derivedBits = await webcrypto.subtle.deriveBits(
        {
            name: ALGORITHM,
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-512'
        },
        keyMaterial,
        KEY_LENGTH * 8
    );

    const computedHash = Buffer.from(derivedBits).toString('hex');

    return computedHash === storedHash;
}
```

### Auth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User                    Frontend                  Backend       │
│   │                         │                         │          │
│   │─── Enter credentials ──>│                         │          │
│   │                         │─── POST /api/auth/login ─>│        │
│   │                         │                         │          │
│   │                         │    Validate credentials │          │
│   │                         │    Generate tokens      │          │
│   │                         │                         │          │
│   │                         │<── Access token (body) ─│          │
│   │                         │<── Refresh token (cookie)│         │
│   │                         │                         │          │
│   │<── Store access token ──│                         │          │
│   │    in memory            │                         │          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     TOKEN REFRESH FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend                                          Backend       │
│     │                                                 │          │
│     │─── Access token expired ───────────────────────>│         │
│     │                                                 │          │
│     │─── POST /api/auth/refresh ─────────────────────>│         │
│     │    (with refresh cookie)                        │          │
│     │                                                 │          │
│     │                              Validate refresh   │          │
│     │                              Generate new tokens│          │
│     │                                                 │          │
│     │<── New access token ───────────────────────────│          │
│     │<── New refresh cookie ─────────────────────────│          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Login Options

Users can log in with either:
- **Email + Password**
- **Username + Password**

```typescript
// functions/api/auth/login.ts

export async function onRequestPost({ request, env }) {
    const { identifier, password } = await request.json();

    // Check if identifier is email or username
    const isEmail = identifier.includes('@');

    const user = await env.DB.prepare(`
        SELECT * FROM users
        WHERE ${isEmail ? 'email' : 'username'} = ?
        AND is_active = 1
    `).bind(identifier).first();

    if (!user) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash, user.password_salt);

    if (!isValid) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate tokens...
}
```

---

## 4. Photo Management

### R2 Storage Structure

```
photos/
├── originals/           # Original uploaded images
│   └── {photo_id}.{ext}
└── metadata/            # Optional: EXIF data, etc.
    └── {photo_id}.json
```

### Photo Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHOTO UPLOAD FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Admin                   Frontend                  Backend       │
│    │                        │                         │          │
│    │── Select file(s) ─────>│                         │          │
│    │                        │                         │          │
│    │                        │── POST /api/upload/image ─>│       │
│    │                        │   (multipart/form-data)  │         │
│    │                        │                         │          │
│    │                        │      Validate file type │          │
│    │                        │      Generate unique ID │          │
│    │                        │      Upload to R2       │          │
│    │                        │      Create DB record   │          │
│    │                        │      (status: draft)    │          │
│    │                        │                         │          │
│    │                        │<── Photo metadata ──────│          │
│    │                        │                         │          │
│    │<── Show edit form ─────│                         │          │
│    │                        │                         │          │
│    │── Add title, desc, ───>│                         │          │
│    │   categories, tags     │                         │          │
│    │                        │── PUT /api/photos/{id} ─>│         │
│    │                        │                         │          │
│    │<── Success ────────────│<── Updated photo ───────│          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Photo Status Workflow

```
draft ──────> published ──────> archived
   │              │                 │
   │              │                 │
   └──────────────┴─────────────────┘
         (can transition freely)
```

- **Draft:** Uploaded but not visible to customers
- **Published:** Visible and available for purchase
- **Archived:** Hidden but preserved (e.g., for order history)

---

## 5. Category & Gallery System

### Category Hierarchy

```
Categories (Parent-Child Structure)
├── Landscapes
│   ├── Mountains
│   ├── Beaches
│   └── Forests
├── Wildlife
│   ├── Birds
│   └── Mammals
└── Urban
    ├── Architecture
    └── Street
```

### Category API Response

```typescript
interface Category {
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    description: string;
    coverImageUrl: string;
    displayOrder: number;
    isActive: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    children?: Category[];      // Nested children when requested
    photoCount?: number;        // Aggregated count
    createdAt: string;
    updatedAt: string;
}
```

### Gallery Features

Galleries are curated collections that can include photos from multiple categories.

```typescript
interface Gallery {
    id: string;
    name: string;
    slug: string;
    description: string;
    coverImageUrl: string;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    photos?: Photo[];           // When requested with photos
    photoCount?: number;
    createdAt: string;
    updatedAt: string;
}
```

---

## 6. Product & Pricing System

### Product Types

| Type | Description |
|------|-------------|
| Print | Standard photo prints on paper |
| Canvas | Gallery-wrapped canvas prints |
| Framed | Prints with frame options |

### Product Configuration (Admin)

Admins can configure:
1. **Product Types** (Print, Canvas, Framed)
2. **Sizes per Type** with fixed pricing
3. **Bay Photo Product Mapping** (when configured)

```typescript
interface ProductSize {
    id: string;
    productTypeId: string;
    productType?: ProductType;
    name: string;              // "8x10", "16x20"
    width: number;             // inches
    height: number;            // inches
    price: number;             // USD
    bayPhotoProductId?: number;
    isActive: boolean;
    displayOrder: number;
}
```

### Price Display

```
Photo: Mountain Sunset
─────────────────────────────────
Print Options:
  • 8x10  - $25.00
  • 11x14 - $45.00
  • 16x20 - $75.00
  • 24x36 - $150.00

Canvas Options:
  • 16x20 - $175.00
  • 24x36 - $295.00
  • 30x40 - $395.00

Framed Options:
  • 8x10  - $85.00
  • 11x14 - $125.00
  • 16x20 - $195.00
─────────────────────────────────
```

---

## 7. Order System

### Order Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORDER FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ADD TO CART                                                  │
│     └── Select photo + product type + size + quantity            │
│                                                                  │
│  2. CHECKOUT                                                     │
│     ├── Guest: Enter shipping info + email                       │
│     └── User: Use saved info or enter new                        │
│                                                                  │
│  3. PAYMENT (Stripe)                                             │
│     └── Create PaymentIntent → Process card → Webhook            │
│                                                                  │
│  4. ORDER CREATED                                                │
│     ├── Status: paid                                             │
│     ├── Send confirmation email                                  │
│     └── Generate order_guid for tracking                         │
│                                                                  │
│  5. SUBMIT TO BAY PHOTO                                          │
│     ├── Map products to Bay Photo IDs                            │
│     ├── Submit order via API                                     │
│     └── Status: submitted                                        │
│                                                                  │
│  6. FULFILLMENT                                                  │
│     ├── Bay Photo processes order                                │
│     ├── Status: processing → shipped                             │
│     └── Store tracking info                                      │
│                                                                  │
│  7. DELIVERY                                                     │
│     ├── Status: delivered                                        │
│     └── Send delivery confirmation email                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Order Status Transitions

```
pending ──(payment)──> paid ──(bay photo submit)──> submitted
                                                        │
                                                        v
cancelled <───────── processing ──(ship)──> shipped ──> delivered
```

### Order Tracking (Guests)

Guests can track orders using:
- **Order Number** (human-readable, e.g., "APW-20240115-001")
- **Email Address** (must match order)
- **Order GUID** (sent in confirmation email as direct link)

**Tracking URL Format:**
```
https://photos.ssmithrentals.com/order-tracking?guid={order_guid}
```

### Guest Order Linking

When a guest creates an account with an email that has existing orders:
- System prompts: "We found X orders associated with this email. Would you like to link them to your account?"
- If confirmed, orders are linked via `user_id` field

---

## 8. Payment Integration

### Stripe Integration

**Stripe Checkout Flow:**

```typescript
// functions/api/checkout/create-payment-intent.ts

export async function onRequestPost({ request, env }) {
    const { items, shippingInfo } = await request.json();

    // Calculate totals
    const subtotal = calculateSubtotal(items);
    const shipping = await getShippingCost(shippingInfo); // From Bay Photo
    const tax = 0; // Handled by Stripe Tax or Bay Photo
    const total = subtotal + shipping + tax;

    // Create Stripe PaymentIntent
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // cents
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
            order_items: JSON.stringify(items.map(i => ({
                photo_id: i.photoId,
                product_size_id: i.productSizeId,
                quantity: i.quantity
            })))
        }
    });

    return Response.json({
        clientSecret: paymentIntent.client_secret,
        subtotal,
        shipping,
        tax,
        total
    });
}
```

**Stripe Webhook Handler:**

```typescript
// functions/api/webhooks/stripe.ts

export async function onRequestPost({ request, env }) {
    const sig = request.headers.get('stripe-signature');
    const body = await request.text();

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
        body,
        sig,
        env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object, env);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object, env);
            break;
    }

    return new Response('OK');
}

async function handlePaymentSuccess(paymentIntent, env) {
    // Create order in database
    const order = await createOrder(paymentIntent, env);

    // Send confirmation email
    await sendOrderConfirmation(order, env);

    // Submit to Bay Photo (if configured)
    if (await isBayPhotoConfigured(env)) {
        await submitToBayPhoto(order, env);
    }
}
```

---

## 9. Bay Photo API Integration

### Configuration

```typescript
// functions/lib/bay-photo.ts

interface BayPhotoConfig {
    accessToken: string;
    baseUrl: string;
}

class BayPhotoClient {
    private config: BayPhotoConfig;

    constructor(config: BayPhotoConfig) {
        this.config = config;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Token token="${this.config.accessToken}"`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`Bay Photo API error: ${response.status}`);
        }

        return response.json();
    }

    // Fetch all available products
    async getProducts(): Promise<BayPhotoProduct[]> {
        return this.request('/api/v1/products.json');
    }

    // Fetch available services
    async getServices(): Promise<BayPhotoService[]> {
        return this.request('/api/v1/services.json');
    }

    // Create an order
    async createOrder(order: BayPhotoOrderRequest): Promise<BayPhotoOrderResponse> {
        return this.request('/api/v1/orders.json', {
            method: 'POST',
            body: JSON.stringify(order)
        });
    }

    // Get all orders (for status checking)
    async getOrders(): Promise<BayPhotoOrder[]> {
        return this.request('/api/v1/orders.json');
    }
}
```

### Bay Photo Order Submission

```typescript
// Submit order to Bay Photo

async function submitToBayPhoto(order: Order, orderItems: OrderItem[], env: Env) {
    const client = new BayPhotoClient({
        accessToken: env.BAY_PHOTO_ACCESS_TOKEN,
        baseUrl: 'https://order-api.bayphoto.com'
    });

    const bayPhotoOrder = {
        order_name: order.orderNumber,
        order_date: new Date().toISOString(),
        shipping_billing_code: order.shippingMethod || 'FEDEX2',
        customer: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone,
            address1: order.shippingAddress1,
            address2: order.shippingAddress2,
            city: order.shippingCity,
            state: order.shippingState,
            country: order.shippingCountry,
            zip: order.shippingZip
        },
        products: await Promise.all(orderItems.map(async item => {
            const photo = await getPhoto(item.photoId, env);
            const productSize = await getProductSize(item.productSizeId, env);

            return {
                product_id: productSize.bayPhotoProductId,
                qty: item.quantity,
                image_file_name: photo.originalFilename,
                image_source_path: photo.url, // R2 public URL
                crop_height: item.cropHeight?.toString() || '100.0',
                crop_width: item.cropWidth?.toString() || '100.0',
                crop_x: item.cropX?.toString() || '0.0',
                crop_y: item.cropY?.toString() || '0.0',
                degrees_rotated: item.rotation || 0,
                print_services: [] // Add any services if needed
            };
        }))
    };

    const response = await client.createOrder(bayPhotoOrder);

    // Update order with Bay Photo reference
    await env.DB.prepare(`
        UPDATE orders
        SET bay_photo_order_id = ?,
            bay_photo_order_name = ?,
            status = 'submitted',
            submitted_to_bay_photo_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
    `).bind(response.id, order.orderNumber, order.id).run();

    // Log status change
    await logOrderStatus(order.id, 'submitted', 'Order submitted to Bay Photo', env);
}
```

### Product Sync (Admin)

```typescript
// Sync Bay Photo products to local cache

async function syncBayPhotoProducts(env: Env) {
    const client = new BayPhotoClient({
        accessToken: env.BAY_PHOTO_ACCESS_TOKEN,
        baseUrl: 'https://order-api.bayphoto.com'
    });

    const products = await client.getProducts();
    const services = await client.getServices();

    // Upsert products
    for (const product of products) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO bay_photo_products
            (id, name, price, print_size_x, print_size_y, square_inch, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
            product.id,
            product.name,
            product.price,
            product.print_size_x,
            product.print_size_y,
            product.square_inch
        ).run();
    }

    // Upsert services
    for (const service of services) {
        await env.DB.prepare(`
            INSERT OR REPLACE INTO bay_photo_services
            (id, name, description, price, last_synced_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
            service.id,
            service.name,
            service.description,
            service.price
        ).run();
    }

    return { productsCount: products.length, servicesCount: services.length };
}
```

---

## 10. Admin Dashboard

### Admin Routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard overview |
| `/admin/photos` | Photo management (CRUD) |
| `/admin/photos/new` | Upload new photos |
| `/admin/photos/:id` | Edit photo details |
| `/admin/categories` | Category management |
| `/admin/galleries` | Gallery management |
| `/admin/products` | Product types & pricing |
| `/admin/orders` | Order management |
| `/admin/orders/:id` | Order details |
| `/admin/users` | User management |
| `/admin/users/new` | Create new admin |
| `/admin/analytics` | Analytics dashboard |
| `/admin/bay-photo` | Bay Photo config & products |
| `/admin/settings` | Site settings |

### Dashboard Widgets

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  ORDERS     │  │  REVENUE    │  │  PHOTOS     │              │
│  │  Today: 5   │  │  Today: $450│  │  Total: 234 │              │
│  │  Week: 23   │  │  Week: $2.1k│  │  Published: │              │
│  │  Month: 89  │  │  Month: $8k │  │  198        │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  RECENT ORDERS                                               ││
│  ├──────────┬────────────┬──────────┬───────────┬──────────────┤│
│  │ Order #  │ Customer   │ Total    │ Status    │ Date         ││
│  ├──────────┼────────────┼──────────┼───────────┼──────────────┤│
│  │ APW-001  │ John Doe   │ $125.00  │ Shipped   │ Jan 15, 2024 ││
│  │ APW-002  │ Jane Smith │ $89.00   │ Processing│ Jan 15, 2024 ││
│  │ APW-003  │ Bob Wilson │ $245.00  │ Paid      │ Jan 14, 2024 ││
│  └──────────┴────────────┴──────────┴───────────┴──────────────┘│
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │  POPULAR PHOTOS            │  │  QUICK ACTIONS             │ │
│  │  1. Mountain Sunset (45)   │  │  [+ Add Photo]             │ │
│  │  2. Ocean Waves (38)       │  │  [+ New Gallery]           │ │
│  │  3. Forest Path (32)       │  │  [Sync Bay Photo]          │ │
│  │  4. City Lights (28)       │  │  [View Analytics]          │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Featured Photos Management

Admin can toggle between:
- **Manual Mode:** Admin curates the featured/popular photos list
- **Auto Mode:** System automatically selects based on order count

```typescript
// Toggle popular photos mode

async function updatePopularPhotosMode(mode: 'manual' | 'auto', env: Env) {
    await env.DB.prepare(`
        UPDATE settings SET value = ?, updated_at = datetime('now')
        WHERE key = 'popular_photos_mode'
    `).bind(mode).run();

    if (mode === 'auto') {
        await regenerateAutoPopularPhotos(env);
    }
}

async function regenerateAutoPopularPhotos(env: Env) {
    const countSetting = await env.DB.prepare(`
        SELECT value FROM settings WHERE key = 'popular_photos_auto_count'
    `).first();
    const count = parseInt(countSetting?.value || '10');

    // Clear existing auto-generated
    await env.DB.prepare(`
        DELETE FROM featured_photos
        WHERE feature_type = 'popular' AND is_auto_generated = 1
    `).run();

    // Get top photos by order count
    const topPhotos = await env.DB.prepare(`
        SELECT id FROM photos
        WHERE status = 'published'
        ORDER BY order_count DESC
        LIMIT ?
    `).bind(count).all();

    // Insert as auto-generated popular
    for (let i = 0; i < topPhotos.results.length; i++) {
        await env.DB.prepare(`
            INSERT INTO featured_photos (photo_id, feature_type, display_order, is_auto_generated)
            VALUES (?, 'popular', ?, 1)
        `).bind(topPhotos.results[i].id, i).run();
    }
}
```

### Admin User Management

Create new admins from `/admin/users/new`:

```typescript
interface CreateAdminRequest {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

// Only existing admins can create new admins
```

---

## 11. Email System

### Resend Configuration

```typescript
// functions/lib/resend.ts

import { Resend } from 'resend';

export function getResendClient(apiKey: string) {
    return new Resend(apiKey);
}

export async function sendEmail(
    env: Env,
    to: string,
    subject: string,
    html: string
) {
    const resend = getResendClient(env.RESEND_API_KEY);

    await resend.emails.send({
        from: env.EMAIL_FROM || 'noreply@photos.ssmithrentals.com',
        to,
        subject,
        html
    });
}
```

### Email Templates

| Email Type | Trigger | Content |
|------------|---------|---------|
| Order Confirmation | Payment success | Order details, tracking link |
| Order Shipped | Status → shipped | Tracking number, carrier info |
| Password Reset | User request | Reset link (24hr expiry) |
| Welcome | Account creation | Welcome message, getting started |

### Order Confirmation Email

```typescript
function generateOrderConfirmationEmail(order: Order, items: OrderItem[]): string {
    return `
        <h1>Thank you for your order!</h1>
        <p>Order Number: <strong>${order.orderNumber}</strong></p>

        <h2>Order Details</h2>
        <table>
            <tr>
                <th>Item</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
            </tr>
            ${items.map(item => `
                <tr>
                    <td>${item.photoTitle}</td>
                    <td>${item.productSizeName}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
            `).join('')}
        </table>

        <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
        <p><strong>Shipping:</strong> $${order.shippingCost.toFixed(2)}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>

        <h2>Shipping Address</h2>
        <p>
            ${order.customerName}<br>
            ${order.shippingAddress1}<br>
            ${order.shippingAddress2 ? order.shippingAddress2 + '<br>' : ''}
            ${order.shippingCity}, ${order.shippingState} ${order.shippingZip}<br>
            ${order.shippingCountry}
        </p>

        <p>
            <a href="https://photos.ssmithrentals.com/order-tracking?guid=${order.orderGuid}">
                Track Your Order
            </a>
        </p>
    `;
}
```

---

## 12. Analytics

### Google Analytics Integration

Add to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

The GA ID is stored in settings and injected dynamically.

### Custom Analytics

Track:
- **Page Views:** Per photo, gallery, category
- **Photo Popularity:** View count + order count
- **Revenue:** Daily, weekly, monthly aggregates
- **Order Metrics:** Count, average value, status breakdown

### Analytics API

```typescript
// GET /api/admin/analytics/overview

interface AnalyticsOverview {
    today: {
        pageViews: number;
        uniqueVisitors: number;
        orders: number;
        revenue: number;
    };
    week: {
        pageViews: number;
        uniqueVisitors: number;
        orders: number;
        revenue: number;
    };
    month: {
        pageViews: number;
        uniqueVisitors: number;
        orders: number;
        revenue: number;
    };
    popularPhotos: Array<{
        id: string;
        title: string;
        viewCount: number;
        orderCount: number;
    }>;
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        customerName: string;
        total: number;
        status: string;
        createdAt: string;
    }>;
}
```

### SEO Meta Tags

Photos, galleries, and categories support custom meta tags:

```typescript
interface MetaTags {
    metaTitle: string;        // <title> and og:title
    metaDescription: string;  // <meta name="description"> and og:description
    metaKeywords: string;     // <meta name="keywords">
}
```

Admin can set these per item, with fallbacks to auto-generated values.

---

## 13. API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/photos` | List published photos (paginated) |
| GET | `/api/photos/:id` | Get single photo details |
| GET | `/api/categories` | List active categories (with hierarchy) |
| GET | `/api/categories/:slug` | Get category with photos |
| GET | `/api/galleries` | List active galleries |
| GET | `/api/galleries/:slug` | Get gallery with photos |
| GET | `/api/products` | Get product types and sizes |
| GET | `/api/featured` | Get featured/popular photos |
| POST | `/api/checkout/create-payment-intent` | Create Stripe payment |
| POST | `/api/orders` | Create order (after payment) |
| GET | `/api/orders/track` | Track order by guid/email |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (email or username) |
| POST | `/api/auth/logout` | Logout (clear refresh token) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### User Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/orders` | Get user's order history |
| GET | `/api/user/cart` | Get saved cart |
| POST | `/api/user/cart` | Add to cart |
| PUT | `/api/user/cart/:id` | Update cart item |
| DELETE | `/api/user/cart/:id` | Remove from cart |

### Admin Endpoints (Admin Role Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| **Photos** |
| GET | `/api/admin/photos` | List all photos |
| POST | `/api/admin/photos` | Create photo |
| PUT | `/api/admin/photos/:id` | Update photo |
| DELETE | `/api/admin/photos/:id` | Delete photo |
| **Categories** |
| GET | `/api/admin/categories` | List all categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |
| **Galleries** |
| GET | `/api/admin/galleries` | List all galleries |
| POST | `/api/admin/galleries` | Create gallery |
| PUT | `/api/admin/galleries/:id` | Update gallery |
| DELETE | `/api/admin/galleries/:id` | Delete gallery |
| **Products** |
| GET | `/api/admin/products` | List product types/sizes |
| POST | `/api/admin/products/types` | Create product type |
| PUT | `/api/admin/products/types/:id` | Update product type |
| POST | `/api/admin/products/sizes` | Create product size |
| PUT | `/api/admin/products/sizes/:id` | Update product size |
| **Orders** |
| GET | `/api/admin/orders` | List all orders |
| GET | `/api/admin/orders/:id` | Get order details |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| **Users** |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create admin user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Deactivate user |
| **Analytics** |
| GET | `/api/admin/analytics/overview` | Analytics overview |
| GET | `/api/admin/analytics/revenue` | Revenue reports |
| GET | `/api/admin/analytics/photos` | Photo performance |
| **Bay Photo** |
| GET | `/api/admin/bay-photo/products` | List cached Bay Photo products |
| POST | `/api/admin/bay-photo/sync` | Sync products from API |
| GET | `/api/admin/bay-photo/services` | List cached services |
| **Settings** |
| GET | `/api/admin/settings` | Get all settings |
| PUT | `/api/admin/settings` | Update settings |
| **Upload** |
| POST | `/api/admin/upload/image` | Upload image to R2 |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/stripe` | Stripe payment webhooks |

---

## 14. Frontend Components

### Routing Structure

```typescript
// src/app/app.routes.ts

export const routes: Routes = [
    // Public routes
    { path: '', redirectTo: 'gallery', pathMatch: 'full' },
    { path: 'gallery', loadComponent: () => import('./features/gallery/gallery.component') },
    { path: 'photo/:id', loadComponent: () => import('./features/photo-detail/photo-detail.component') },
    { path: 'categories', loadComponent: () => import('./features/categories/categories.component') },
    { path: 'category/:slug', loadComponent: () => import('./features/category/category.component') },
    { path: 'galleries/:slug', loadComponent: () => import('./features/gallery-view/gallery-view.component') },
    { path: 'cart', loadComponent: () => import('./features/cart/cart.component') },
    { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component') },
    { path: 'order-tracking', loadComponent: () => import('./features/order-tracking/order-tracking.component') },
    { path: 'order-confirmation/:id', loadComponent: () => import('./features/order-confirmation/order-confirmation.component') },

    // Auth routes
    { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
    { path: 'register', loadComponent: () => import('./features/auth/register/register.component') },
    { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component') },
    { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component') },

    // User routes (authenticated)
    {
        path: 'account',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'profile', pathMatch: 'full' },
            { path: 'profile', loadComponent: () => import('./features/account/profile/profile.component') },
            { path: 'orders', loadComponent: () => import('./features/account/order-history/order-history.component') },
            { path: 'orders/:id', loadComponent: () => import('./features/account/order-detail/order-detail.component') },
        ]
    },

    // Admin routes
    {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
            { path: '', loadComponent: () => import('./features/admin/dashboard/dashboard.component') },
            { path: 'photos', loadComponent: () => import('./features/admin/photos/photo-list/photo-list.component') },
            { path: 'photos/new', loadComponent: () => import('./features/admin/photos/photo-upload/photo-upload.component') },
            { path: 'photos/:id', loadComponent: () => import('./features/admin/photos/photo-edit/photo-edit.component') },
            { path: 'categories', loadComponent: () => import('./features/admin/categories/category-list/category-list.component') },
            { path: 'galleries', loadComponent: () => import('./features/admin/galleries/gallery-list/gallery-list.component') },
            { path: 'products', loadComponent: () => import('./features/admin/products/product-list/product-list.component') },
            { path: 'orders', loadComponent: () => import('./features/admin/orders/order-list/order-list.component') },
            { path: 'orders/:id', loadComponent: () => import('./features/admin/orders/order-detail/order-detail.component') },
            { path: 'users', loadComponent: () => import('./features/admin/users/user-list/user-list.component') },
            { path: 'users/new', loadComponent: () => import('./features/admin/users/user-create/user-create.component') },
            { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics.component') },
            { path: 'bay-photo', loadComponent: () => import('./features/admin/bay-photo/bay-photo.component') },
            { path: 'settings', loadComponent: () => import('./features/admin/settings/settings.component') },
        ]
    },

    // Fallback
    { path: '**', redirectTo: 'gallery' }
];
```

### Key Components

**Photo Detail Component:**
- Display photo with metadata
- Product type selector (Print/Canvas/Framed)
- Size selector with prices
- Quantity selector
- Add to cart button
- Related photos section

**Cart Component:**
- List cart items
- Update quantities
- Remove items
- Show subtotal
- Proceed to checkout button
- Works with localStorage for guests, API for logged-in users

**Checkout Component:**
- Shipping address form
- Order summary
- Stripe Elements integration
- Guest checkout option
- "Create account" checkbox for guests

**Order Tracking Component:**
- Order number + email input (guests)
- Or direct access via GUID link
- Order status timeline
- Tracking information display

---

## 15. Security Considerations

### Authentication Security

- Passwords hashed with PBKDF2 (100,000 iterations, SHA-512)
- Unique salt per user
- JWT access tokens (15 min expiry)
- Refresh tokens in httpOnly cookies
- Rate limiting on auth endpoints

### API Security

- CORS configuration for allowed origins
- Input validation on all endpoints
- SQL parameterized queries (prevent injection)
- File upload validation (type, size)
- Admin routes protected by role check

### Payment Security

- No payment data stored in database
- Stripe handles PCI compliance
- Webhook signature verification
- HTTPS only

### Headers (Cloudflare)

```
/_headers

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; img-src 'self' https://*.r2.cloudflarestorage.com https://images.unsplash.com; script-src 'self' https://js.stripe.com https://www.googletagmanager.com; frame-src https://js.stripe.com; connect-src 'self' https://api.stripe.com https://*.google-analytics.com;
```

---

## 16. Local Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Initial Setup

```bash
# Clone repository
cd C:\GitHub\adrian-photos-web

# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create adrian-photos-db

# Create R2 bucket
wrangler r2 bucket create adrian-photos-storage
```

### Wrangler Configuration

```toml
# wrangler.toml

name = "adrian-photos-web"
compatibility_date = "2024-01-15"
pages_build_output_dir = "dist/adrian-photos-web/browser"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "adrian-photos-db"
database_id = "your-database-id-here"

# R2 Storage
[[r2_buckets]]
binding = "R2"
bucket_name = "adrian-photos-storage"

# Environment Variables (set via dashboard or wrangler secret)
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
# RESEND_API_KEY
# JWT_SECRET
# BAY_PHOTO_ACCESS_TOKEN (when available)
```

### Run Migrations

```bash
# Run all migrations locally
wrangler d1 execute adrian-photos-db --local --file=./migrations/0001_initial_schema.sql
wrangler d1 execute adrian-photos-db --local --file=./migrations/0002_seed_admin.sql

# Run migrations on production
wrangler d1 execute adrian-photos-db --file=./migrations/0001_initial_schema.sql
wrangler d1 execute adrian-photos-db --file=./migrations/0002_seed_admin.sql
```

### Local Development

```bash
# Start Angular dev server
npm start

# In another terminal, start Wrangler for Functions
wrangler pages dev dist/adrian-photos-web/browser --d1=DB --r2=R2

# Or run both together
npm run dev  # (configure in package.json)
```

### Environment Variables

Set locally in `.dev.vars`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
EMAIL_FROM=noreply@photos.ssmithrentals.com
```

Set in production via Cloudflare dashboard or:

```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
```

---

## 17. Deployment

### Cloudflare Pages Deployment

```bash
# Build Angular app
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist/adrian-photos-web/browser
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: adrian-photos-web
          directory: dist/adrian-photos-web/browser
```

### Custom Domain

Current: https://photos.ssmithrentals.com

Configure in Cloudflare Pages dashboard:
1. Go to project settings
2. Add custom domain
3. Configure DNS (CNAME to pages.dev)

---

## 18. Future Considerations

### Potential Enhancements

1. **Bay Photo Payment Integration**
   - If Bay Photo handles payments directly, switch from Stripe
   - Implement webhook handling for Bay Photo events

2. **Advanced Image Processing**
   - Generate thumbnails on upload (using Cloudflare Images)
   - Automatic image optimization
   - Watermarking for preview images

3. **Customer Reviews**
   - Review system for purchased photos
   - Star ratings
   - Photo reviews on product pages

4. **Wishlists**
   - Allow users to save photos for later
   - Share wishlist functionality

5. **Gift Certificates**
   - Purchase gift cards
   - Redeem at checkout

6. **Discounts & Promotions**
   - Coupon codes
   - Bulk pricing discounts
   - Seasonal sales

7. **Print Preview**
   - Show how photo will look at different sizes
   - Room visualization (AR)

8. **Multi-Currency**
   - Support international customers
   - Currency conversion

9. **Social Sharing**
   - Share photos on social media
   - Embed galleries on external sites

10. **Photographer Portal**
    - Multiple photographers
    - Revenue sharing
    - Individual portfolios

---

## Appendix A: TypeScript Interfaces

```typescript
// src/app/core/models/index.ts

export interface User {
    id: string;
    email: string;
    username: string | null;
    role: 'customer' | 'admin';
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Photo {
    id: string;
    title: string;
    description: string | null;
    filename: string;
    originalFilename: string;
    r2Key: string;
    url: string;
    width: number | null;
    height: number | null;
    fileSize: number | null;
    mimeType: string | null;
    status: 'draft' | 'published' | 'archived';
    displayOrder: number;
    viewCount: number;
    orderCount: number;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    categories?: Category[];
    galleries?: Gallery[];
    tags?: Tag[];
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    description: string | null;
    coverImageUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    children?: Category[];
    photoCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Gallery {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    coverImageUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    photos?: Photo[];
    photoCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}

export interface ProductType {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
    sizes?: ProductSize[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductSize {
    id: string;
    productTypeId: string;
    productType?: ProductType;
    name: string;
    width: number;
    height: number;
    price: number;
    bayPhotoProductId: number | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    orderGuid: string;
    userId: string | null;
    customerEmail: string;
    customerName: string;
    customerPhone: string | null;
    shippingAddress1: string;
    shippingAddress2: string | null;
    shippingCity: string;
    shippingState: string;
    shippingCountry: string;
    shippingZip: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    status: OrderStatus;
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    bayPhotoOrderId: string | null;
    bayPhotoOrderName: string | null;
    shippingCarrier: string | null;
    shippingTrackingNumber: string | null;
    shippingMethod: string | null;
    estimatedDeliveryDate: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    items?: OrderItem[];
    statusHistory?: OrderStatusHistory[];
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
    submittedToBayPhotoAt: string | null;
    cancelledAt: string | null;
}

export type OrderStatus =
    | 'pending'
    | 'paid'
    | 'submitted'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export interface OrderItem {
    id: string;
    orderId: string;
    photoId: string;
    photo?: Photo;
    productSizeId: string;
    productSize?: ProductSize;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    bayPhotoProductId: number | null;
    cropX: number | null;
    cropY: number | null;
    cropWidth: number | null;
    cropHeight: number | null;
    rotation: number;
    createdAt: string;
}

export interface OrderStatusHistory {
    id: string;
    orderId: string;
    status: string;
    notes: string | null;
    createdAt: string;
}

export interface CartItem {
    id: string;
    photoId: string;
    photo?: Photo;
    productSizeId: string;
    productSize?: ProductSize;
    quantity: number;
}

export interface BayPhotoProduct {
    id: number;
    name: string;
    price: number;
    printSizeX: number | null;
    printSizeY: number | null;
    squareInch: number | null;
    lastSyncedAt: string;
}

export interface BayPhotoService {
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    lastSyncedAt: string;
}
```

---

## Appendix B: API Response Formats

### Success Response

```json
{
    "success": true,
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Email is required",
        "details": { ... }
    }
}
```

### Paginated Response

```json
{
    "success": true,
    "data": [ ... ],
    "pagination": {
        "page": 1,
        "pageSize": 20,
        "total": 150,
        "totalPages": 8
    }
}
```

---

*Document Version: 1.0*
*Last Updated: January 2024*
*Author: Claude (Anthropic)*
