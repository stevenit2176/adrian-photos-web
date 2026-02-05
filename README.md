# Adrian Photos Web - E-Commerce Photography Platform

A modern photography e-commerce platform built with Angular 21, Cloudflare Pages, and Material Design. Users can browse photo galleries, purchase prints in various formats and sizes, and complete secure checkout with Stripe integration.

## Features

### Frontend
- **Responsive Photo Gallery**: Browse photos by category with auto-playing carousel
- **Photo Detail Pages**: View high-resolution photos with product selection options
- **Shopping Cart**: Add prints to cart with real-time pricing calculations
- **Secure Checkout**: Stripe-powered payment processing
- **User Authentication**: Register, login, and manage orders
- **Admin Dashboard**: Upload photos, manage categories, view orders
- **Material Design**: Clean, modern UI using Angular Material components
- **Fully Responsive**: Works beautifully on desktop, tablet, and mobile devices

### Backend
- **Cloudflare Pages Functions**: Serverless API with edge computing
- **D1 Database**: SQLite-based database for users, photos, products, orders
- **R2 Storage**: Object storage for photo files and thumbnails
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Stripe Integration**: Payment processing and webhooks
- **Bay Photo Integration**: Automated order fulfillment (planned)
- **Custom Typography**: Google Fonts (Prata for headlines, Barlow for body text)

## Typography

- **H1 & H2**: Prata (elegant serif font)
- **H3 and below**: Oswald (modern sans-serif)
- **Body text**: Oswald

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- Cloudflare account (free tier works)
- Stripe account (for payments - optional for development)

### Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up backend infrastructure:**
   - See [SETUP.md](docs/SETUP.md) for complete backend setup (D1 database, R2 storage, environment variables)

3. **Run development server:**
```bash
npm run dev
```

Frontend: `http://localhost:4200/`  
Backend API: `http://localhost:8788/api`

### Deployment

- **Quick Deploy**: See [DEPLOY.md](docs/DEPLOY.md) for fast Cloudflare Pages deployment
- **Detailed Guide**: See [CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md) for comprehensive deployment instructions

### Build

Build the project for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
adrian-photos-web/
├── src/                          # Frontend (Angular 21)
│   ├── app/
│   │   ├── auth/                 # Login & Register components
│   │   ├── gallery/              # Photo gallery
│   │   ├── photo-detail/         # Individual photo view
│   │   ├── cart/                 # Shopping cart
│   │   ├── admin/                # Admin dashboard
│   │   ├── services/             # API services
│   │   ├── guards/               # Route guards
│   │   ├── interceptors/         # HTTP interceptors
│   │   └── models/               # TypeScript interfaces
│   └── assets/
├── functions/                     # Backend (Cloudflare Functions)
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication
│   │   ├── photos/               # Photo management
│   │   ├── cart/                 # Cart calculations
│   │   ├── categories/           # Category management
│   │   └── products/             # Product pricing
│   └── lib/                      # Shared utilities
│       ├── db.ts                 # D1 database helpers
│       ├── auth.ts               # JWT & password utilities
│       ├── r2.ts                 # R2 storage helpers
│       └── middleware.ts         # Auth middleware
├── migrations/                    # Database migrations
├── docs/                          # Documentation
│   ├── architecture/              # Technical architecture docs
│   ├── SPEC.md                    # Technical specification
│   └── SETUP.md                   # Setup guides
└── wrangler.toml                 # Cloudflare configuration
```

## Documentation

### Architecture & Specifications
- [SPEC.md](docs/SPEC.md) - Complete technical specification
- [architecture/](docs/architecture/) - Detailed architecture documentation
  - [00-MVP-OVERVIEW.md](docs/architecture/00-MVP-OVERVIEW.md) - MVP scope and goals
  - [10-IMPLEMENTATION-ORDER.md](docs/architecture/10-IMPLEMENTATION-ORDER.md) - Phase-by-phase build plan
  - Module-specific docs for database, authentication, photo management, etc.

### Setup & Deployment
- [SETUP.md](docs/SETUP.md) - Backend infrastructure setup
- [DEPLOY.md](docs/DEPLOY.md) - Quick deployment guide
- [CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md) - Detailed deployment instructions
- [TEST_AUTH_API.md](docs/TEST_AUTH_API.md) - API testing guide

### Progress Tracking
- [PHASE1-COMPLETE.md](docs/PHASE1-COMPLETE.md) - ✅ Database & Backend Infrastructure
- [PHASE2-COMPLETE.md](docs/PHASE2-COMPLETE.md) - ✅ Authentication API
- [PHASE3-COMPLETE.md](docs/PHASE3-COMPLETE.md) - ✅ Frontend Authentication

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21 (Standalone Components) |
| Styling | Angular Material 21, SCSS, Google Fonts (Prata, Barlow) |
| Backend | Cloudflare Pages Functions |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Authentication | JWT Tokens |
| Payments | Stripe |
| Fulfillment | Bay Photo API (planned) |

## Customization

### Changing Colors

Modify the Material theme in [src/styles.scss](src/styles.scss) to customize the color palette.

### Adjusting Carousel Speed

Change the interval in the `startAutoPlay()` method in [src/app/gallery/gallery.component.ts](src/app/gallery/gallery.component.ts) (default: 5000ms).

## Technologies Used

- Angular 18
- Angular Material
- TypeScript
- SCSS
- Google Fonts (Prata & Oswald)

## License

MIT
