# Vercel Deployment Guide for Separate Forms

This guide explains how to deploy each form type as a separate, independent application on Vercel.

## Overview

You have 4 independent form applications:
- **Shop** (`/shop`)
- **Domestic Warehouse** (`/domestic`)
- **Export Warehouse** (`/export`)
- **Online Warehouse** (`/online`)

Each has its own layout and branding, with NO navigation links between them.

## Deployment Strategy

### Option 1: Subdomains (Recommended)
Deploy the entire app once, then share specific URLs:

1. Deploy to Vercel normally:
   ```bash
   cd frontend
   vercel --prod
   ```

2. Share specific URLs with each user type:
   - Shop users: `https://yourdomain.com/shop`
   - Domestic warehouse: `https://yourdomain.com/domestic`
   - Export warehouse: `https://yourdomain.com/export`
   - Online warehouse: `https://yourdomain.com/online`

3. Users can only access their specific URL - there's no navigation to other forms.

### Option 2: Separate Deployments
Deploy each route as a separate Vercel project:

1. **Create 4 separate Vercel projects** for each form type

2. **For Shop deployment:**
   - Set "Root Directory" to `frontend`
   - Add environment variable: `NEXT_PUBLIC_FORM_TYPE=shop`
   - Configure rewrites in `vercel.json` (see below)

3. **Repeat for other form types** with their respective `FORM_TYPE` values

### Option 3: Custom Domains
Assign different domains/subdomains:
- `shop.yourdomain.com` → `/shop`
- `domestic.yourdomain.com` → `/domestic`
- `export.yourdomain.com` → `/export`
- `online.yourdomain.com` → `/online`

Configure in Vercel dashboard under "Domains" → Add rewrites.

## Vercel Configuration (Optional)

If you want to redirect root paths for separate deployments, create `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/shop"
    }
  ]
}
```

Change the destination based on which form type you're deploying.

## Security Notes

✅ Each form has its own layout - no shared navigation
✅ No links between different form types
✅ Users can only access forms if they know the exact URL
⚠️ For true authentication, add login/auth middleware (not included)

## Recommended Approach

**Use Option 1 (Subdomains)** - Deploy once, share different URLs:
- Simplest deployment
- Single codebase to maintain
- Share only the specific URL with each user type
- Users can't navigate to other forms (no links exist)

## Quick Deploy to Vercel

```bash
cd frontend
npm install
vercel --prod
```

Then share:
- `your-app.vercel.app/shop` with shop users
- `your-app.vercel.app/domestic` with domestic warehouse users
- `your-app.vercel.app/export` with export warehouse users
- `your-app.vercel.app/online` with online warehouse users

Done! 🚀
