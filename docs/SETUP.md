# Backend Setup Guide

## Phase 1: Database & Backend Infrastructure ✅

This guide will walk you through setting up the backend infrastructure for the Adrian Photos e-commerce platform.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Cloudflare account (free tier works)
- Git

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Wrangler CLI (Cloudflare development tool)
- Cloudflare Workers types for TypeScript
- All existing Angular dependencies

## Step 2: Cloudflare Setup

### Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window to authenticate with Cloudflare.

### Create D1 Database

```bash
npm run db:create
```

This creates a new D1 database named `adrian-photos-db`. Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "adrian-photos-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace this
```

### Create R2 Bucket

```bash
npm run r2:create
```

This creates an R2 bucket named `adrian-photos` for photo storage.

## Step 3: Run Database Migrations

### Local Development (Testing)

```bash
npm run db:migrate:local
npm run db:seed:local
```

### Production Database

```bash
npm run db:migrate
npm run db:seed
```

This creates all tables and seeds initial data:
- Admin user (email: admin@adrianphotos.com, password: Admin123!)
- 6 categories (Landscapes, Portraits, Abstract, Wildlife, Architecture, Black & White)
- 3 product types (Fine Art Print, Canvas, Metal Print)
- 15 product sizes with pricing

## Step 4: Set Up Environment Variables

### Create Local Environment File

```bash
cp .dev.vars.example .dev.vars
```

### Edit `.dev.vars` and add your secrets:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
BAYPHOTO_API_KEY=your_bayphoto_api_key_here
```

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Set Production Secrets (when ready to deploy)

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put BAYPHOTO_API_KEY
```

## Step 5: Test the Setup

### Build the Frontend

```bash
npm run build
```

### Start Local Development Server

```bash
npm run dev
```

This starts a local server at `http://localhost:8788` with:
- Angular frontend
- Cloudflare Functions backend
- Local D1 database

### Test Backend API (once we create endpoints)

```bash
# Example: Test auth endpoint (coming in next phase)
curl http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@adrianphotos.com","password":"Admin123!"}'
```

## Project Structure

```
adrian-photos-web/
├── functions/                    # Cloudflare Functions (Backend)
│   ├── api/                     # API endpoints (coming next)
│   │   ├── auth/               # Authentication endpoints
│   │   ├── photos/             # Photo management
│   │   ├── checkout/           # Stripe checkout
│   │   └── ...
│   ├── lib/                    # Shared libraries ✅
│   │   ├── types.ts           # TypeScript types
│   │   ├── utils.ts           # Utility functions
│   │   ├── validation.ts      # Input validation
│   │   ├── db.ts              # Database helpers
│   │   ├── auth.ts            # JWT & password utilities
│   │   └── middleware.ts      # Auth & error middleware
│   └── _middleware.ts         # Global CORS handler ✅
├── migrations/                  # Database migrations ✅
│   ├── 0001_initial_schema.sql
│   └── 0002_seed_data.sql
├── src/                        # Angular Frontend
│   ├── app/
│   │   ├── gallery/           # Existing gallery component
│   │   └── ...               # More components coming
│   └── ...
├── architecture/               # Technical documentation ✅
├── wrangler.toml              # Cloudflare configuration ✅
├── .dev.vars.example          # Example environment file ✅
└── package.json               # Dependencies & scripts ✅
```

## Database Schema

### Tables Created

1. **users** - User accounts (customers and admins)
2. **refresh_tokens** - JWT refresh tokens
3. **categories** - Photo categories
4. **photos** - Photo metadata and R2 keys
5. **product_types** - Product types (Fine Art, Canvas, Metal)
6. **product_sizes** - Sizes and pricing
7. **orders** - Customer orders
8. **order_items** - Line items in orders

See [architecture/01-DATABASE.md](architecture/01-DATABASE.md) for full schema details.

## Backend Libraries

All libraries follow **DRY** and **clean code** principles:

- **types.ts** - Shared TypeScript interfaces
- **utils.ts** - Reusable utility functions (ID generation, response formatting, pagination, etc.)
- **validation.ts** - Input validation (email, password, addresses, etc.)
- **db.ts** - Database query helpers with camelCase conversion
- **auth.ts** - JWT generation/verification, password hashing
- **middleware.ts** - Authentication, authorization, error handling

## Available NPM Scripts

```bash
# Frontend Development
npm start                  # Start Angular dev server (port 4200)
npm run build             # Build Angular production bundle
npm run watch             # Build in watch mode

# Backend Development
npm run dev               # Full-stack dev server (port 8788)
npm run dev:frontend      # Frontend only
npm run dev:backend       # Backend only (requires build first)

# Database Operations
npm run db:create         # Create D1 database (one-time)
npm run db:migrate        # Run migrations on production DB
npm run db:seed           # Seed production DB with initial data
npm run db:migrate:local  # Run migrations locally
npm run db:seed:local     # Seed local DB

# R2 Storage
npm run r2:create         # Create R2 bucket (one-time)

# Deployment
npm run deploy            # Build and deploy to Cloudflare Pages
```

## Next Steps

✅ **Phase 1 Complete**: Database and backend infrastructure are ready!

**Phase 2**: Authentication API
- Create auth endpoints (register, login, refresh, logout)
- Implement JWT token flow
- Test authentication

See [architecture/10-IMPLEMENTATION-ORDER.md](architecture/10-IMPLEMENTATION-ORDER.md) for the complete roadmap.

## Troubleshooting

### Database ID not set
- Run `npm run db:create` and copy the database_id to wrangler.toml

### Wrangler login fails
- Make sure you're logged into Cloudflare in your browser
- Try `npx wrangler logout` then `npx wrangler login` again

### Local development not working
- Run `npm run build` first to create the dist folder
- Check that wrangler.toml has correct database_id
- Make sure `.dev.vars` file exists with required secrets

### Database migrations fail
- Check the SQL syntax in migration files
- Ensure database_id in wrangler.toml is correct
- Try running locally first: `npm run db:migrate:local`

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
