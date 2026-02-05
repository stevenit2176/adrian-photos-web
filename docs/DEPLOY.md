# Quick Start: Deploy to Cloudflare Pages

> **Note**: This is a quick deployment guide for the frontend. For complete backend setup (D1 database, R2 storage, environment variables), see [SETUP.md](SETUP.md). For detailed deployment instructions with troubleshooting, see [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

## 1. Push to GitHub

If you haven't set up your GitHub remote yet:

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/adrian-photos-web.git
git push -u origin main
```

If your remote is already set up:

```bash
git push
```

## 2. Deploy to Cloudflare Pages

1. Go to https://dash.cloudflare.com/
2. Click "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
3. Select your `adrian-photos-web` repository
4. Configure:
   - **Framework preset:** Angular
   - **Build command:** `npm run build`
   - **Build output directory:** `dist/adrian-photos-web/browser`
5. Click "Save and Deploy"

Your site will be live at: `https://YOUR-PROJECT-NAME.pages.dev`

## 3. Future Updates

Just push to main:

```bash
git add .
git commit -m "Your update message"
git push
```

Cloudflare will automatically rebuild and deploy!

## 4. Configure Backend (Required for Full Functionality)

After deployment, set up the backend infrastructure:

1. **Database**: Follow [SETUP.md](SETUP.md) to create D1 database and run migrations
2. **Storage**: Create R2 bucket for photo storage
3. **Environment Variables**: Set JWT_SECRET, Stripe keys, etc. in Cloudflare dashboard
4. **Test**: Use [TEST_AUTH_API.md](TEST_AUTH_API.md) to verify API endpoints

---

## Additional Resources

- **Detailed Deployment**: [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)
- **Backend Setup**: [SETUP.md](SETUP.md)
- **Full Specification**: [SPEC.md](SPEC.md)
- **Architecture Docs**: [architecture/](architecture/)
