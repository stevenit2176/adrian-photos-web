# Quick Start: Deploy to Cloudflare Pages

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

---

See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) for detailed instructions.
