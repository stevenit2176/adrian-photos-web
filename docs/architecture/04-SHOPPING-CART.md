# Shopping Cart Architecture (MVP)

## Overview
Client-side shopping cart stored in localStorage. Simple, stateless approach for MVP.

## Cart Structure
```typescript
interface CartItem {
  id: string; // unique cart item ID
  photoId: string;
  photoTitle: string;
  photoThumbnail: string;
  productTypeId: string;
  productTypeName: string;
  productSizeId: string;
  productSizeName: string;
  unitPrice: number; // in cents
  quantity: number;
  total: number; // unitPrice * quantity
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number; // calculated at checkout
  shipping: number; // calculated at checkout
  total: number;
}
```

## Cart Operations
- Add item (photo + product type + size)
- Update quantity
- Remove item
- Clear cart
- Calculate totals
- Persist to localStorage
- Sync with checkout

## Backend Implementation

### API Endpoints (2 endpoints)

#### 1. POST /api/cart/calculate
```typescript
Request: { items: CartItem[], shippingState?: string }
Response: { subtotal, tax, shipping, total }
Purpose: Calculate tax and shipping based on cart contents
```

#### 2. GET /api/products/pricing
```typescript
Response: { productTypes[], productSizes[] }
Purpose: Get current pricing for all products
```

## Frontend Implementation

### Cart Service
```typescript
// src/app/services/cart.service.ts
- addItem(photoId, productTypeId, productSizeId, quantity)
- updateQuantity(itemId, quantity)
- removeItem(itemId)
- clearCart()
- getCart()
- getItemCount()
- calculateTotals()
- syncWithServer() // get latest pricing and calculate tax/shipping
```

### Components
```typescript
// src/app/cart/cart.component.ts
- Display cart items
- Update quantities
- Remove items
- Show totals
- Proceed to checkout button

// src/app/shared/cart-icon/cart-icon.component.ts
- Show cart item count in navbar
- Click to open cart
```

## Implementation Tasks

### Backend
- [ ] Create `functions/api/cart/calculate.ts`
  - [ ] Calculate subtotal from items
  - [ ] Calculate tax based on shipping state (simple: 8% for CA, 0% for others)
  - [ ] Calculate shipping (flat rate: $15 for MVP)
  - [ ] Return totals
- [ ] Create `functions/api/products/pricing.ts`
  - [ ] Query product_types and product_sizes
  - [ ] Return current pricing

### Frontend
- [ ] Create `src/app/services/cart.service.ts`
  - [ ] localStorage operations
  - [ ] Cart state management (BehaviorSubject)
  - [ ] Add/update/remove methods
  - [ ] Total calculations
- [ ] Create `src/app/cart/cart.component.ts`
  - [ ] Route: /cart
  - [ ] Display cart items in table
  - [ ] Quantity controls (+/- buttons)
  - [ ] Remove item button
  - [ ] Totals display
  - [ ] Checkout button (navigates to /checkout)
- [ ] Create `src/app/shared/cart-icon/cart-icon.component.ts`
  - [ ] Badge with item count
  - [ ] Add to navbar
  - [ ] Link to /cart
- [ ] Add cart routes to app.routes.ts
- [ ] Create cart models/interfaces in `src/app/models/cart.model.ts`

## Cart Persistence
- **Storage**: localStorage
- **Key**: `adrian-photos-cart`
- **Format**: JSON string of Cart object
- **Expiry**: None (persists until manually cleared)

## Add to Cart Flow
1. User on photo detail page
2. Selects product type (e.g., "Fine Art Print")
3. Selects size (e.g., "16x20")
4. Clicks "Add to Cart"
5. Cart service adds item with price lookup
6. Cart icon updates count
7. Success notification shown
8. User can continue shopping or go to cart

## Pricing Strategy (MVP)
- Base prices stored in database (product_sizes table)
- No dynamic pricing or discounts for MVP
- Tax: Simple state-based (8% for CA, 0% for others)
- Shipping: Flat rate $15 per order
- Future: Calculate per-item shipping, quantity discounts, etc.

## Testing Checklist
- [ ] Add item to cart from photo detail
- [ ] Cart icon shows correct count
- [ ] View cart page
- [ ] Update item quantity
- [ ] Remove item from cart
- [ ] Cart persists after page refresh
- [ ] Empty cart shows appropriate message
- [ ] Totals calculate correctly
- [ ] Tax calculation works
- [ ] Shipping calculation works
