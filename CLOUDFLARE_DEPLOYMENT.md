# Cloudflare Pages Deployment Guide

This guide will help you deploy your Adrian Photos Web app to Cloudflare Pages via GitHub.

## Prerequisites

- GitHub account
- Cloudflare account (free tier works)
- Git installed locally

## Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name: `adrian-photos-web` (or your preferred name)
   - Make it Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Push your local code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit - Adrian Photos Gallery"
   git remote add origin https://github.com/YOUR_USERNAME/adrian-photos-web.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Connect to Cloudflare Pages

1. **Login to Cloudflare:**
   - Go to https://dash.cloudflare.com/
   - Navigate to "Workers & Pages" from the left sidebar

2. **Create a new Pages project:**
   - Click "Create application"
   - Select "Pages" tab
   - Click "Connect to Git"

3. **Connect your GitHub repository:**
   - Click "Connect GitHub" (authorize if needed)
   - Select your `adrian-photos-web` repository
   - Click "Begin setup"

4. **Configure build settings:**
   - **Project name:** `adrian-photos-web` (or your preferred subdomain)
   - **Production branch:** `main`
   - **Framework preset:** Angular
   - **Build command:** `npm run build`
   - **Build output directory:** `dist/adrian-photos-web/browser`
   - **Root directory:** (leave empty)
   - **Environment variables:** None needed for now

5. **Deploy:**
   - Click "Save and Deploy"
   - Wait for the build to complete (usually 2-5 minutes)

## Step 3: Your Site is Live!

Once deployment completes, your site will be available at:
- `https://adrian-photos-web.pages.dev` (or your custom project name)

## Automatic Deployments

Now, every time you push to the `main` branch on GitHub, Cloudflare Pages will automatically:
1. Pull the latest code
2. Run `npm install`
3. Run `npm run build`
4. Deploy the new version

## Custom Domain (Optional)

To use your own domain:
1. In Cloudflare Pages project settings, go to "Custom domains"
2. Click "Set up a custom domain"
3. Follow the DNS configuration steps

## Troubleshooting

### Build fails
- Check build logs in Cloudflare dashboard
- Ensure `package.json` has all dependencies
- Verify build command works locally: `npm run build`

### 404 errors on routes
- Ensure `_redirects` file is in the project root
- This file handles Angular routing for single-page apps

### Styles not loading
- Check that assets are properly referenced
- Verify build output directory is correct

## Environment Variables

If you need to add environment variables later:
1. Go to your Pages project > Settings > Environment variables
2. Add variables for Production and/or Preview environments
3. Redeploy for changes to take effect

## Preview Deployments

Every pull request to your repository will get its own preview URL:
- `https://BRANCH-NAME.adrian-photos-web.pages.dev`
- Perfect for testing before merging to main!
