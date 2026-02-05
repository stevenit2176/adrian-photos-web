# Photo Management Architecture (MVP)

## Overview
Upload, store, and serve photos using Cloudflare R2. Admin can upload photos, assign to categories, and manage metadata.

## R2 Storage Strategy
- **Bucket**: `adrian-photos`
- **Original photos**: `originals/{photoId}.jpg`
- **Thumbnails**: `thumbnails/{photoId}.jpg` (800px wide)
- **Public access**: R2 bucket with custom domain or public URL

## Image Processing
- Upload original image to R2
- Generate thumbnail (800px wide, maintain aspect ratio)
- Store both versions
- Record R2 keys in database

## Backend Implementation

### Libraries Needed
```typescript
// functions/lib/r2.ts
- @cloudflare/workers-types
- sharp (image processing - run in build step or use external service)
```

### API Endpoints (5 endpoints)

#### 1. POST /api/photos (Admin only)
```typescript
Request: FormData { file, title, description, categoryId }
Response: { photo }
Process:
- Validate file (JPEG/PNG, max 50MB)
- Generate UUID for photo
- Upload original to R2
- Create thumbnail (800px wide)
- Upload thumbnail to R2
- Insert record to database
```

#### 2. GET /api/photos
```typescript
Query: ?categoryId=xxx&page=1&limit=20
Response: { photos[], total, page, pages }
```

#### 3. GET /api/photos/:id
```typescript
Response: { photo }
```

#### 4. PUT /api/photos/:id (Admin only)
```typescript
Request: { title?, description?, categoryId?, isActive?, displayOrder? }
Response: { photo }
```

#### 5. DELETE /api/photos/:id (Admin only)
```typescript
Response: { message }
Process:
- Delete from R2 (original + thumbnail)
- Delete from database
```

## Frontend Implementation

### Photo Service
```typescript
// src/app/services/photo.service.ts
- getPhotos(categoryId?, page?, limit?)
- getPhotoById(id)
- uploadPhoto(file, metadata) // admin only
- updatePhoto(id, updates) // admin only
- deletePhoto(id) // admin only
```

### Public Components
```typescript
// src/app/gallery/ (already exists - enhance)
- Display photos grid
- Link to photo detail

// src/app/photo-detail/
- Show large photo
- Display title, description
- Show product options (print types/sizes)
- Add to cart button
```

### Admin Components
```typescript
// src/app/admin/photos/
- Upload form with drag-and-drop
- Photo list with edit/delete
- Update metadata
- Reorder photos
```

## Implementation Tasks

### Backend
- [ ] Create R2 bucket via Cloudflare dashboard
- [ ] Create `functions/lib/r2.ts`
  - [ ] uploadFile(file, key)
  - [ ] getFile(key)
  - [ ] deleteFile(key)
  - [ ] generateThumbnail(buffer) - using sharp or external service
- [ ] Create `functions/api/photos/index.ts` (GET - list photos)
- [ ] Create `functions/api/photos/[id].ts` (GET - single photo)
- [ ] Create `functions/api/photos/upload.ts` (POST - admin upload)
- [ ] Create `functions/api/photos/update.ts` (PUT - admin update)
- [ ] Create `functions/api/photos/delete.ts` (DELETE - admin delete)
- [ ] Configure R2 bindings in wrangler.toml

### Frontend
- [ ] Create `src/app/services/photo.service.ts`
- [ ] Enhance `src/app/gallery/gallery.component.ts`
  - [ ] Load photos from API instead of hardcoded
  - [ ] Implement pagination
  - [ ] Filter by category
- [ ] Create `src/app/photo-detail/photo-detail.component.ts`
  - [ ] Route: /photos/:id
  - [ ] Display photo full size
  - [ ] Show product options
  - [ ] Add to cart functionality
- [ ] Create `src/app/admin/photos/photo-upload/photo-upload.component.ts`
  - [ ] File upload with preview
  - [ ] Metadata form (title, description, category)
  - [ ] Progress indicator
- [ ] Create `src/app/admin/photos/photo-list/photo-list.component.ts`
  - [ ] Table view with thumbnails
  - [ ] Edit/delete actions
  - [ ] Pagination
- [ ] Add routes to app.routes.ts

## R2 Configuration
```toml
# wrangler.toml
[[r2_buckets]]
binding = "R2"
bucket_name = "adrian-photos"
```

## Environment Variables
```
R2_BUCKET_NAME=adrian-photos
R2_PUBLIC_URL=https://photos.yourdomain.com
```

## Image Specifications
- **Upload**: JPEG or PNG, max 50MB
- **Original**: Store as uploaded
- **Thumbnail**: 800px width, maintain aspect ratio, JPEG 85% quality
- **Formats**: Support JPEG, PNG (convert to JPEG for web)

## Testing Checklist
- [ ] Upload photo via admin
- [ ] View photo in gallery
- [ ] Click photo to see detail page
- [ ] Update photo metadata
- [ ] Delete photo (verify R2 cleanup)
- [ ] Pagination works correctly
- [ ] Category filtering works
- [ ] Large file upload (test limits)
- [ ] Invalid file type rejection
