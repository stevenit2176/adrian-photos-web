# Google Analytics 4 Setup Guide

This application uses Google Analytics 4 (GA4) with the Measurement Protocol to track user behavior and display analytics in the admin dashboard.

## Current Configuration

- **Measurement ID:** `G-9QKHWCWXTH`
- **Property ID:** `523127739`
- **Tracking Method:** Google Analytics 4 Measurement Protocol

## What's Currently Implemented

### ✅ Frontend Tracking (Active)
The application automatically tracks:
- **Page Views** - Every page navigation
- **Add to Cart Events** - When users add framed photos to cart
- **Purchase Events** - Ready to track completed orders (when checkout is implemented)

All tracking is done via the `AnalyticsTrackingService` which:
- Generates a unique client ID stored in localStorage
- Sends events to GA4 via the Measurement Protocol
- Uses `navigator.sendBeacon()` for non-blocking tracking
- Only sends data in production (configurable via `environment.enableAnalytics`)

### ⚠️ Dashboard Analytics (Mock Data)
The admin dashboard currently shows **mock data**. To display real analytics:
1. Events need time to appear in GA4 (24-48 hours for full processing)
2. Requires implementing Google Analytics Data API with service account authentication

## Setup Instructions

### Step 1: Get a Measurement Protocol API Secret

The Measurement Protocol requires an API secret to send events to GA4.

1. Go to [Google Analytics](https://analytics.google.com)
2. Navigate to **Admin** (bottom left)
3. Under **Data collection and modification**, click **Data Streams**
4. Select your web data stream (should show `G-9QKHWCWXTH`)
5. Scroll down to **Measurement Protocol API secrets**
6. Click **Create** to generate a new API secret
7. Give it a name like "Production Website"
8. Copy the **Secret value**

### Step 2: Configure the Application

Update the production environment file:

**File:** `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  enableAnalytics: true,
  ga4MeasurementId: 'G-9QKHWCWXTH',
  ga4ApiSecret: 'YOUR_API_SECRET_HERE' // ← Paste the secret here
};
```

### Step 3: Deploy

Deploy the application to Cloudflare Pages:

```bash
npm run deploy
```

### Step 4: Verify Tracking

1. Visit your live website
2. Navigate to different pages and add items to cart
3. Go to Google Analytics → Reports → Realtime
4. You should see active users and events appearing within seconds

## Viewing Analytics Data

### Real-time Data (Immediate)
- Go to GA4 → **Reports** → **Realtime**
- See current active users, page views, and events

### Historical Reports (24-48 hours)
- Go to GA4 → **Reports** → **Engagement** → **Events**
- View page_view, add_to_cart, and other custom events
- Use **Exploration** for custom reports

## Optional: Dashboard Analytics (Advanced)

To show real analytics data in the admin dashboard (instead of mock data), you need to implement the Google Analytics Data API.

### Requirements:
1. Google Cloud Project with Analytics Data API enabled
2. Service Account with Analytics Viewer role
3. Service Account JSON key
4. Implementation of Web Crypto API for JWT signing in Cloudflare Workers

### Implementation Steps:

#### 1. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Enable the **Google Analytics Data API**
4. Navigate to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account**
6. Name it (e.g., "analytics-readonly")
7. Grant role: **Viewer** (or create custom role with `analyticsdata.runReport`)
8. Create and download JSON key

#### 2. Grant Analytics Access

1. Go to [Google Analytics](https://analytics.google.com)
2. Navigate to **Admin**
3. Under **Property**, click **Property Access Management**
4. Click **+** to add users
5. Add the service account email (e.g., `analytics-readonly@project.iam.gserviceaccount.com`)
6. Assign **Viewer** role
7. Save

#### 3. Configure Cloudflare Pages

Add the service account key as an environment variable:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment Variables**
3. Add variable:
   - **Name:** `GA4_SERVICE_ACCOUNT_KEY`
   - **Value:** Paste the entire JSON key file contents
   - **Type:** Plain text (it will be encrypted)
4. Add for production environment

#### 4. Implement API Calls

Update `functions/api/analytics/stats.ts` to:
1. Parse the service account JSON from env
2. Generate OAuth2 JWT token using Web Crypto API (RSA-SHA256)
3. Exchange JWT for access token
4. Call Google Analytics Data API REST endpoint:
   ```
   POST https://analyticsdata.googleapis.com/v1beta/properties/523127739:runReport
   ```
5. Parse response and return to dashboard

**Note:** This is complex because Cloudflare Workers doesn't support Node.js built-ins. You must use Web Crypto API for JWT signing instead of libraries like `jsonwebtoken`.

## Tracked Events

### Page View
```typescript
{
  name: 'page_view',
  params: {
    page_location: 'https://yoursite.com/gallery',
    page_path: '/gallery',
    page_title: 'Photo Gallery',
    engagement_time_msec: 12345
  }
}
```

### Add to Cart
```typescript
{
  name: 'add_to_cart',
  params: {
    currency: 'USD',
    value: 125.00,
    items: [{
      item_id: '123',
      item_name: 'Sunset Photo - Framed Print (8x10)',
      price: 125.00
    }]
  }
}
```

### Purchase (Ready to implement)
```typescript
{
  name: 'purchase',
  params: {
    transaction_id: 'ORD-2026-001',
    currency: 'USD',
    value: 350.00,
    items: [...]
  }
}
```

## Testing in Development

By default, analytics events are **not sent** in development mode. To enable:

**File:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: '/api',
  enableAnalytics: true, // ← Change to true to test in dev
  ga4MeasurementId: 'G-9QKHWCWXTH',
  ga4ApiSecret: 'YOUR_API_SECRET_HERE'
};
```

Events will be logged to console in development for debugging.

## Troubleshooting

### Events not appearing in GA4 Realtime
- Check that API secret is correctly configured
- Verify Measurement ID matches your GA4 property
- Check browser console for tracking errors
- Ensure you're testing on the production build (or enableAnalytics is true in dev)

### Dashboard shows mock data
- This is expected - real data requires Analytics Data API implementation
- Events are still being tracked and visible in GA4 Reports

### CORS errors
- Measurement Protocol doesn't have CORS issues (uses sendBeacon)
- If using fetch(), it's a fire-and-forget request with `mode: 'no-cors'`

## Resources

- [GA4 Measurement Protocol Documentation](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Google Analytics Help](https://support.google.com/analytics)
- [Web Crypto API (for JWT signing)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
