# MVP Overview

## Goal
Build a simplified but functional photography e-commerce platform where users can browse photos, add prints to cart, checkout with Stripe, and have orders fulfilled through Bay Photo.

## Core Features (MVP)
- ✅ Photo gallery with categories (already built)
- User authentication (login/register)
- Photo detail pages with print options
- Shopping cart
- Stripe checkout
- Order management
- Bay Photo integration for fulfillment
- Basic admin dashboard (photo upload, order viewing)

## Out of Scope for MVP
- Advanced analytics
- Galleries (collections of photos)
- User favorites/wishlists
- Discount codes
- Multiple shipping addresses
- Product reviews
- Email marketing
- Advanced admin features
- Blog/content management

## Technology Stack
- **Frontend**: Angular 21 + Angular Material
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Payments**: Stripe
- **Fulfillment**: Bay Photo API
- **Email**: Resend

## Implementation Order
1. Database schema (core tables only)
2. Authentication system
3. Backend API infrastructure
4. Photo management
5. Shopping cart & checkout
6. Stripe integration
7. Bay Photo integration
8. Admin dashboard basics
9. Frontend routing & components
10. Testing & deployment

## Success Criteria
- Users can browse photos by category
- Users can create account and login
- Users can add prints to cart
- Users can checkout with Stripe
- Orders are automatically sent to Bay Photo
- Admin can upload photos and view orders
