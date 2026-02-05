# Bay Photo Integration Architecture (MVP)

## Overview
Integrate with Bay Photo Lab API for print fulfillment. After successful payment, automatically submit orders to Bay Photo.

## Bay Photo API
- **Documentation**: https://www.bayphoto.com/api/
- **Authentication**: API Key
- **Format**: REST API (JSON)
- **Endpoints**: Order creation, status tracking, product catalog

## Order Fulfillment Flow
1. Payment successful (Stripe webhook)
2. Retrieve order from database
3. Download photo from R2
4. Upload photo to Bay Photo
5. Create Bay Photo order with line items
6. Store Bay Photo order ID in database
7. Update order status to "processing"
8. Bay Photo ships directly to customer
9. Webhook updates order status to "shipped"

## Product Mapping
Map our product types/sizes to Bay Photo product codes:

```typescript
// Product mapping examples
{
  "Fine Art Print": {
    "8x10": "BAYPHOTO_CODE_8x10_PRINT",
    "11x14": "BAYPHOTO_CODE_11x14_PRINT",
    "16x20": "BAYPHOTO_CODE_16x20_PRINT"
  },
  "Canvas": {
    "16x20": "BAYPHOTO_CODE_16x20_CANVAS",
    "24x36": "BAYPHOTO_CODE_24x36_CANVAS"
  },
  "Metal Print": {
    "12x18": "BAYPHOTO_CODE_12x18_METAL",
    "16x24": "BAYPHOTO_CODE_16x24_METAL"
  }
}
```

## Backend Implementation

### Libraries Needed
```typescript
// functions/lib/bay-photo.ts
- node-fetch or native fetch
- form-data (for file uploads)
```

### Core Functions

#### functions/lib/bay-photo.ts
```typescript
- authenticateWithBayPhoto()
- uploadPhoto(photoBuffer, filename)
- createOrder(orderDetails, lineItems, shipping)
- getOrderStatus(bayPhotoOrderId)
- mapProductCode(productTypeId, productSizeId)
```

### API Endpoints (2 endpoints)

#### 1. POST /api/fulfillment/submit-order
```typescript
Request: { orderId }
Response: { bayPhotoOrderId, status }
Purpose: Manually submit order to Bay Photo (triggered by webhook or admin)
Process:
- Get order from database
- Get order items (photos, products, sizes)
- Download photos from R2
- Upload photos to Bay Photo
- Create Bay Photo order
- Update order with Bay Photo ID
```

#### 2. POST /api/fulfillment/webhook
```typescript
Request: Bay Photo webhook payload
Purpose: Receive status updates from Bay Photo
Process:
- Verify webhook signature
- Update order status based on Bay Photo status
- Send customer notification email
```

## Implementation Tasks

### Bay Photo Setup
- [ ] Create Bay Photo account
- [ ] Get API credentials (API Key, Account ID)
- [ ] Review product catalog and codes
- [ ] Create product mapping table
- [ ] Set up webhook endpoint in Bay Photo dashboard

### Backend
- [ ] Create `functions/lib/bay-photo.ts`
  - [ ] authenticateWithBayPhoto()
  - [ ] uploadPhoto(buffer, filename)
  - [ ] createOrder(orderData)
  - [ ] getOrderStatus(orderId)
  - [ ] mapProductCode(typeId, sizeId)
- [ ] Create `functions/api/fulfillment/submit-order.ts`
  - [ ] Retrieve order and items
  - [ ] Download photos from R2
  - [ ] Upload to Bay Photo
  - [ ] Create Bay Photo order
  - [ ] Store Bay Photo order ID
  - [ ] Update order status
- [ ] Create `functions/api/fulfillment/webhook.ts`
  - [ ] Verify Bay Photo webhook
  - [ ] Update order status
  - [ ] Trigger email notification
- [ ] Update `functions/api/checkout/webhook.ts`
  - [ ] Call submitOrder() after payment success
- [ ] Add Bay Photo credentials to environment variables

### Database
- [ ] Update product_types table with bay_photo_product_code
- [ ] Seed product codes in migration

### Admin (Optional for MVP)
- [ ] Create admin view for order status
- [ ] Manual "Submit to Bay Photo" button for failed orders
- [ ] View Bay Photo order status

## Bay Photo Order Payload Example
```typescript
{
  "accountId": "YOUR_ACCOUNT_ID",
  "orderNumber": "ORD-123456", // our internal order ID
  "shipping": {
    "name": "John Doe",
    "address1": "123 Main St",
    "address2": "Apt 4",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US"
  },
  "items": [
    {
      "productCode": "BAYPHOTO_CODE_16x20_PRINT",
      "quantity": 1,
      "imageUrl": "https://r2-url/photos/photo-123.jpg",
      "filename": "sunset-beach.jpg"
    }
  ]
}
```

## Environment Variables
```
BAYPHOTO_API_KEY=xxx
BAYPHOTO_ACCOUNT_ID=xxx
BAYPHOTO_API_URL=https://api.bayphoto.com/v1
BAYPHOTO_WEBHOOK_SECRET=xxx
```

## Error Handling
- **Photo upload fails**: Retry up to 3 times
- **Order creation fails**: Mark order as "failed", notify admin
- **Connection timeout**: Queue for retry
- **Invalid product code**: Log error, use default product

## Status Mapping
```typescript
// Our status -> Bay Photo status
{
  "pending": "not submitted",
  "paid": "ready to submit",
  "processing": "submitted",
  "printing": "in production",
  "shipped": "shipped",
  "delivered": "delivered",
  "cancelled": "cancelled"
}
```

## Testing Checklist
- [ ] Submit test order to Bay Photo sandbox
- [ ] Verify photo upload to Bay Photo
- [ ] Verify order creation in Bay Photo dashboard
- [ ] Test webhook status updates
- [ ] Test error handling (failed upload)
- [ ] Test product code mapping
- [ ] Verify shipping address format
- [ ] Test multiple items in one order
- [ ] Test order cancellation flow

## Bay Photo Sandbox
- Use Bay Photo's test/sandbox environment for development
- Test mode API key provided by Bay Photo
- No actual printing occurs
- Can simulate order status changes

## Notes
- Bay Photo requires high-resolution images (minimum 300 DPI for print sizes)
- Photos should be uploaded at full resolution from R2 originals
- Bay Photo handles color correction and printing
- Typical production time: 3-5 business days
- Bay Photo provides tracking numbers via webhook
