# 🚀 Quick Deployment Checklist

Use this checklist to deploy your Podcast Transcript Ripper to Vercel.

## Step 1: Get Your Apple API Token

- [ ] Go to [podcasts.apple.com](https://podcasts.apple.com)
- [ ] Sign in with your Apple ID
- [ ] Open Browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Play any podcast episode
- [ ] Find request to `amp-api.podcasts.apple.com`
- [ ] Copy the Bearer token from Authorization header
- [ ] Save token somewhere safe

**Need help?** See [GETTING_TOKEN.md](GETTING_TOKEN.md) for detailed instructions.

## Step 2: Deploy to Vercel

### Option A: One-Click Deploy (Easiest)

- [ ] Click: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thvanderwal/PodcastsTranscriptRipper)
- [ ] Sign in/up to Vercel
- [ ] Give your project a name
- [ ] Add environment variable:
  - Name: `APPLE_BEARER_TOKEN`
  - Value: (paste your token from Step 1)
- [ ] Click "Deploy"
- [ ] Wait 1-2 minutes
- [ ] Visit your live site!

### Option B: Connect GitHub Repo

- [ ] Fork this repository to your GitHub account
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Import your forked repository
- [ ] Configure:
  - Framework: Other (or auto-detected)
  - Root Directory: ./
  - Build Command: (leave empty)
  - Output Directory: public
- [ ] Add environment variable before deploying:
  - Name: `APPLE_BEARER_TOKEN`
  - Value: (paste your token)
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Visit your site!

### Option C: Vercel CLI

- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Clone this repo: `git clone <repo-url>`
- [ ] Navigate to directory: `cd PodcastsTranscriptRipper`
- [ ] Login to Vercel: `vercel login`
- [ ] Deploy: `vercel`
- [ ] Add token: `vercel env add APPLE_BEARER_TOKEN`
- [ ] Paste your token when prompted
- [ ] Select all environments (Production, Preview, Development)
- [ ] Deploy to production: `vercel --prod`
- [ ] Visit your site!

**Need more help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

## Step 3: Verify Deployment

- [ ] Visit your Vercel URL (e.g., `your-app.vercel.app`)
- [ ] Test the health endpoint: `your-app.vercel.app/api/health`
  - Should return: `{"status":"ok","hasToken":true,...}`
- [ ] Try extracting a transcript:
  - Find an episode on Apple Podcasts
  - Copy the URL (must have `?i=` parameter)
  - Paste into your app
  - Click "Extract Transcript"
  - Verify it works!

## Step 4: Optional - Custom Domain

- [ ] Go to your Vercel project
- [ ] Click Settings → Domains
- [ ] Add your custom domain
- [ ] Follow DNS configuration instructions
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Visit your custom domain!

## Step 5: Set Reminder for Token Refresh

- [ ] Add calendar reminder for 25 days from now
- [ ] Title: "Refresh Apple API Token for Podcast Ripper"
- [ ] Note: Tokens expire every 30 days
- [ ] When reminder triggers:
  - Get new token (repeat Step 1)
  - Update in Vercel: Settings → Environment Variables
  - Edit `APPLE_BEARER_TOKEN` and paste new token
  - Save and redeploy if needed

## Troubleshooting

### ❌ "hasToken: false" in health check
- **Fix:** Token not set. Go to Vercel Settings → Environment Variables → Add `APPLE_BEARER_TOKEN`

### ❌ "Authentication failed" error
- **Fix:** Token expired or invalid. Get new token and update in Vercel.

### ❌ "Transcript not found"
- **Fix:** Episode doesn't have transcript, or URL is wrong. Try different episode.

### ❌ CORS errors
- **Fix:** Use your Vercel URL, not localhost (unless using `vercel dev`).

### ❌ Build failed
- **Fix:** Check Vercel build logs. Ensure `package.json` is in root directory.

**More help:** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting.

## Quick Reference

**Your Vercel Dashboard:** https://vercel.com/dashboard
**Environment Variables:** Project → Settings → Environment Variables
**Deployments:** Project → Deployments
**Logs:** Project → Deployments → (click deployment) → Functions

**Health Check:** `https://your-app.vercel.app/api/health`
**App URL:** `https://your-app.vercel.app`

## Success! 🎉

Your Podcast Transcript Ripper is now live! Share your Vercel URL with friends or use it for your own podcast transcription needs.

**Remember:** Refresh your token every month for uninterrupted service.

---

## Need Help?

1. Check [README.md](README.md) for general info
2. See [GETTING_TOKEN.md](GETTING_TOKEN.md) for token help
3. Read [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details
4. Open a GitHub issue if you're still stuck

Happy transcribing! 🎙️
