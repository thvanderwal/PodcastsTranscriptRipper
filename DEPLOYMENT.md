# Vercel Deployment Guide

This guide walks you through deploying the Podcast Transcript Ripper to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free)
- Your Apple API Bearer Token (see [GETTING_TOKEN.md](GETTING_TOKEN.md))

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Fork or Clone this Repository**
   - Fork this repo to your GitHub account, or
   - Clone it and push to your own GitHub repo

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your repository

3. **Configure the Project**
   - Framework Preset: **Other** (or leave as detected)
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: `public`
   - Install Command: `npm install`

4. **Add Environment Variable**
   - Before deploying, click "Environment Variables"
   - Add:
     - **Name:** `APPLE_BEARER_TOKEN`
     - **Value:** (paste your token from [GETTING_TOKEN.md](GETTING_TOKEN.md))
     - **Environments:** Check all (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)
   - Visit your live site!

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd PodcastsTranscriptRipper
   vercel
   ```

4. **Add Environment Variable**
   ```bash
   vercel env add APPLE_BEARER_TOKEN
   ```
   - Paste your token when prompted
   - Select: Production, Preview, Development

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 3: One-Click Deploy

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thvanderwal/PodcastsTranscriptRipper&env=APPLE_BEARER_TOKEN&envDescription=Apple%20API%20Bearer%20Token%20for%20podcast%20transcript%20access&envLink=https://github.com/thvanderwal/PodcastsTranscriptRipper/blob/main/GETTING_TOKEN.md)

You'll be prompted to add your `APPLE_BEARER_TOKEN` during setup.

## Post-Deployment

### Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "hasToken": true,
     "message": "API is configured and ready"
   }
   ```

2. **Test the App**
   - Visit your Vercel URL
   - Try extracting a transcript from a podcast you know has one

### Custom Domain (Optional)

1. Go to your project on Vercel
2. Settings → Domains
3. Add your custom domain
4. Follow the DNS configuration instructions

## Environment Variables

### Required

- `APPLE_BEARER_TOKEN` - Your Apple API bearer token

### Managing Environment Variables

**Add:**
```bash
vercel env add APPLE_BEARER_TOKEN
```

**Update:**
```bash
vercel env rm APPLE_BEARER_TOKEN
vercel env add APPLE_BEARER_TOKEN
```

**List:**
```bash
vercel env ls
```

**Pull for local development:**
```bash
vercel env pull .env
```

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Main branch** → Production deployment
- **Other branches** → Preview deployment

You can configure this in:
- Vercel Dashboard → Settings → Git

## Updating Your Token

Your token expires every 30 days. To update:

1. **Get a new token** (see [GETTING_TOKEN.md](GETTING_TOKEN.md))

2. **Update in Vercel Dashboard:**
   - Project Settings → Environment Variables
   - Click "Edit" next to `APPLE_BEARER_TOKEN`
   - Paste new token
   - Save

3. **Or via CLI:**
   ```bash
   vercel env rm APPLE_BEARER_TOKEN production
   vercel env add APPLE_BEARER_TOKEN production
   ```

4. **Redeploy:**
   - Vercel usually auto-redeploys
   - Or manually: Settings → Deployments → "..." → Redeploy

## Troubleshooting

### "Authentication failed" after deployment

**Cause:** Token not set or expired

**Fix:**
1. Verify token is set: Visit `/api/health`
2. If `hasToken: false`, add the token
3. If `hasToken: true` but still failing, token is expired - get a new one

### "Function timeout"

**Cause:** Large transcript or slow network

**Fix:** Vercel serverless functions have a 10s timeout on free tier (60s on Pro)
- Usually transcripts load in 2-5 seconds
- If you need longer timeouts, upgrade to Pro plan

### "Module not found"

**Cause:** Dependencies not installed

**Fix:**
1. Verify `package.json` is in the root
2. Redeploy from Vercel dashboard
3. Check build logs for errors

### CORS errors

**Cause:** Misconfigured CORS headers

**Fix:**
- This shouldn't happen with our setup
- Check that you're accessing via the Vercel URL, not IP address
- Clear browser cache

## Monitoring

### View Logs

**Vercel Dashboard:**
- Project → Deployments → Click deployment → Functions tab

**CLI:**
```bash
vercel logs
```

### Analytics

Free tier includes:
- Bandwidth usage
- Function invocations
- Error tracking

View in: Project → Analytics

## Cost

**Free Tier includes:**
- 100 GB bandwidth/month
- 100 GB-hours serverless function execution
- Automatic HTTPS
- Unlimited deployments

This is more than enough for personal use!

**Pro Tier** ($20/month) adds:
- 1 TB bandwidth
- 1000 GB-hours execution
- Better analytics
- Password protection
- Advanced features

## Best Practices

1. **Set a reminder** to refresh your token every 30 days
2. **Monitor usage** in Vercel dashboard
3. **Use preview deployments** to test changes before production
4. **Keep dependencies updated** for security
5. **Don't commit `.env` file** to Git (already in .gitignore)

## Advanced Configuration

### Custom Build Settings

Edit `vercel.json` to customize:
- Build configuration
- Routing rules
- Headers
- Redirects

### Regions

By default, functions deploy globally. To specify regions:

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Project Issues:** https://github.com/thvanderwal/PodcastsTranscriptRipper/issues
- **Token Help:** See [GETTING_TOKEN.md](GETTING_TOKEN.md)

## Quick Reference

**Deploy:**
```bash
vercel --prod
```

**Update token:**
```bash
vercel env add APPLE_BEARER_TOKEN
```

**View logs:**
```bash
vercel logs
```

**Test locally:**
```bash
vercel dev
```

**Pull env vars:**
```bash
vercel env pull
```
