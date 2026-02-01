# Architecture Documentation

This folder contains detailed technical documentation for building the Adrian Photos e-commerce MVP.

## Documentation Structure

### Planning & Overview
- **[00-MVP-OVERVIEW.md](00-MVP-OVERVIEW.md)** - Project goals, scope, and success criteria
- **[10-IMPLEMENTATION-ORDER.md](10-IMPLEMENTATION-ORDER.md)** - Step-by-step build plan with phases and milestones

### Core Modules
- **[01-DATABASE.md](01-DATABASE.md)** - Database schema, tables, and migrations
- **[02-AUTHENTICATION.md](02-AUTHENTICATION.md)** - JWT auth, login/register, security
- **[03-PHOTO-MANAGEMENT.md](03-PHOTO-MANAGEMENT.md)** - R2 storage, upload, photo API
- **[04-SHOPPING-CART.md](04-SHOPPING-CART.md)** - Cart logic, localStorage, pricing
- **[07-ROUTING.md](07-ROUTING.md)** - Angular routes, guards, navigation

### Integrations
- **[05-STRIPE-INTEGRATION.md](05-STRIPE-INTEGRATION.md)** - Payment processing, checkout, webhooks
- **[06-BAYPHOTO-INTEGRATION.md](06-BAYPHOTO-INTEGRATION.md)** - Order fulfillment, product mapping

### Frontend & Backend
- **[08-ADMIN-DASHBOARD.md](08-ADMIN-DASHBOARD.md)** - Admin UI, components, features
- **[09-BACKEND-INFRASTRUCTURE.md](09-BACKEND-INFRASTRUCTURE.md)** - Cloudflare Functions, API structure, libraries

## Quick Start

1. **Read the MVP Overview** - Understand project scope and goals
2. **Review Implementation Order** - See the build plan and phases
3. **Follow Phase 1** - Start with database and backend infrastructure
4. **Reference Module Docs** - Use specific docs as you build each feature

## Technology Stack

- **Frontend**: Angular 21 + Angular Material
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Payments**: Stripe
- **Fulfillment**: Bay Photo API

## File Naming Convention

- `00-XX` - Planning and overview documents
- `01-09` - Core feature/module documentation
- `10+` - Implementation guides and workflows

## Task Tracking

Each .md file contains:
- ✅ **Overview** - What this module does
- ✅ **Architecture** - How it's structured
- ✅ **Implementation Tasks** - Checkboxes for tracking progress
- ✅ **Testing Checklist** - Verification steps
- ✅ **Code Examples** - Reference implementations

## Development Workflow

1. Pick a phase from [10-IMPLEMENTATION-ORDER.md](10-IMPLEMENTATION-ORDER.md)
2. Open the relevant module documentation
3. Complete tasks in order, checking them off
4. Test using the checklist provided
5. Move to next phase when milestone is reached

## Getting Help

- Check the specific module documentation for details
- Refer to SPEC.md in project root for full technical specification
- Review existing code in src/ for implementation examples
- See main README.md for project setup instructions

## Progress Tracking

Update task checkboxes as you complete items:
- `- [ ]` Pending task
- `- [x]` Completed task

This helps track progress across the MVP build.
