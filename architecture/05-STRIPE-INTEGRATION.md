# Stripe Integration Architecture (MVP)

## Overview
Payment processing with Stripe Checkout. Simple hosted checkout flow for MVP.

## Payment Flow
1. User adds items to cart
2. User proceeds to checkout
3. Frontend creates checkout session via API
4. User redirected to Stripe hosted checkout
5. User completes payment
6. Stripe redirects back to success page
7. Webhook confirms payment
8. Order status updated to "paid"
9. Order sent to Bay Photo for fulfillment

## Stripe Setup
- **Mode**: Test mode for development, Live for production
- **Products**: Not managed in Stripe (only in our DB)
- **Payment Methods**: Card payments
- **Webhook Events**: `checkout.session.completed`, `payment_intent.succeeded`

## Backend Implementation

### Libraries Needed
```typescript
// functions/lib/stripe.ts
- stripe (official Stripe SDK)
```

### API Endpoints (3 endpoints)

#### 1. POST /api/checkout/create-session
```typescript
Request: { items: CartItem[], shippingAddress: Address }
Response: { sessionId, url }
Process:
- Validate cart items and prices
- Create order record in database (status: pending)
- Create Stripe checkout session
- Return session URL for redirect
```

#### 2. POST /api/checkout/webhook
```typescript
Request: Stripe webhook payload
Process:
- Verify webhook signature
- Handle checkout.session.completed
  - Update order status to "paid"
  - Store Stripe payment intent ID
  - Trigger Bay Photo fulfillment
- Handle payment_intent.succeeded (backup)
```

#### 3. GET /api/checkout/session/:sessionId
```typescript
Response: { session, order }
Purpose: Retrieve session details for success page
```

## Frontend Implementation

### Checkout Service
```typescript
// src/app/services/checkout.service.ts
- createCheckoutSession(cart, shippingAddress)
- getSessionDetails(sessionId)
```

### Components
```typescript
// src/app/checkout/checkout.component.ts
- Route: /checkout
- Shipping address form
- Order summary
- "Pay with Stripe" button
- Redirect to Stripe on submit

// src/app/checkout/success/success.component.ts
- Route: /checkout/success?session_id=xxx
- Display order confirmation
- Order number and details
- "Continue Shopping" button

// src/app/checkout/cancel/cancel.component.ts
- Route: /checkout/cancel
- "Payment cancelled" message
- Return to cart button
```

## Implementation Tasks

### Stripe Setup
- [ ] Create Stripe account
- [ ] Get API keys (test + live)
- [ ] Set up webhook endpoint in Stripe dashboard
- [ ] Configure success/cancel URLs

### Backend
- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Create `functions/lib/stripe.ts`
  - [ ] initializeStripe()
  - [ ] createCheckoutSession()
  - [ ] verifyWebhookSignature()
- [ ] Create `functions/api/checkout/create-session.ts`
  - [ ] Validate cart items
  - [ ] Create order in database
  - [ ] Create Stripe session with line items
  - [ ] Return session URL
- [ ] Create `functions/api/checkout/webhook.ts`
  - [ ] Verify signature
  - [ ] Handle checkout.session.completed
  - [ ] Update order status
  - [ ] Trigger fulfillment (call Bay Photo)
- [ ] Create `functions/api/checkout/session/[id].ts`
  - [ ] Retrieve session from Stripe
  - [ ] Get order from database
- [ ] Add Stripe keys to environment variables

### Frontend
- [ ] Create `src/app/services/checkout.service.ts`
- [ ] Create `src/app/checkout/checkout.component.ts`
  - [ ] Shipping address form (Material form fields)
  - [ ] Order summary display
  - [ ] Payment button
  - [ ] Handle redirect to Stripe
- [ ] Create `src/app/checkout/success/success.component.ts`
  - [ ] Parse session_id from URL
  - [ ] Load order details
  - [ ] Display confirmation
  - [ ] Clear cart
- [ ] Create `src/app/checkout/cancel/cancel.component.ts`
  - [ ] Cancel message
  - [ ] Link back to cart
- [ ] Add checkout routes to app.routes.ts

## Stripe Checkout Configuration
```typescript
{
  mode: 'payment',
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${photoTitle} - ${productType} - ${size}`,
          images: [thumbnailUrl]
        },
        unit_amount: unitPriceInCents
      },
      quantity: quantity
    }
  ],
  shipping_address_collection: {
    allowed_countries: ['US']
  },
  success_url: 'https://yoursite.com/checkout/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yoursite.com/checkout/cancel',
  metadata: {
    orderId: orderId
  }
}
```

## Environment Variables
```
STRIPE_SECRET_KEY=sk_test_xxx (or sk_live_xxx)
STRIPE_PUBLISHABLE_KEY=pk_test_xxx (or pk_live_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Webhook URL
- **Development**: Use Stripe CLI for local testing
- **Production**: `https://yoursite.com/api/checkout/webhook`

## Testing Checklist
- [ ] Create checkout session from cart
- [ ] Redirect to Stripe checkout works
- [ ] Test card payment (4242 4242 4242 4242)
- [ ] Success redirect with session_id
- [ ] Order status updates to "paid"
- [ ] Webhook signature verification
- [ ] Cancel flow returns to site
- [ ] Cart clears after successful payment
- [ ] Order confirmation displays correctly
- [ ] Multiple items in cart checkout

## Stripe Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits
