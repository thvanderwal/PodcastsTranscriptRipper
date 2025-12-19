# Project Summary: Vercel Serverless Rebuild

## What Was Changed

This project has been rebuilt from a client-side GitHub Pages application to a server-side Vercel serverless application with proper API token authentication.

## New Architecture

### Before (GitHub Pages)
- Fully client-side JavaScript
- Used CORS proxies to fetch RSS feeds
- Limited to public, unauthenticated podcast data
- No server-side components
- Deployed to GitHub Pages (`/docs` folder)

### After (Vercel Serverless)
- Server-side API endpoints (Vercel Functions)
- Client-side static frontend
- Uses authenticated Apple Podcast API
- Secure token management via environment variables
- Deployed to Vercel edge network

## New File Structure

```
PodcastsTranscriptRipper/
├── api/                          # NEW: Vercel serverless functions
│   ├── health.js                 # Health check endpoint
│   └── transcript.js             # Main transcript API
│
├── public/                       # NEW: Static frontend files
│   ├── index.html               # Updated HTML
│   ├── app.js                   # Updated to use API endpoints
│   └── styles.css               # Copied from frontend/
│
├── backend/                      # OLD: Express server (kept for reference)
│   ├── server.js
│   └── package.json
│
├── frontend/                     # OLD: Original frontend (kept for reference)
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── docs/                         # OLD: GitHub Pages version (kept for reference)
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── .env.example                  # NEW: Environment variable template
├── .env.local.example            # NEW: Local dev template
├── .vercelignore                 # NEW: Vercel deployment exclusions
├── vercel.json                   # NEW: Vercel configuration
├── package.json                  # NEW: Root package.json for Vercel
├── package-lock.json             # NEW: Lock file
├── GETTING_TOKEN.md              # NEW: Detailed token instructions
├── DEPLOYMENT.md                 # NEW: Deployment guide
└── README.md                     # UPDATED: Complete rewrite
```

## API Endpoints

### GET `/api/health`
Health check endpoint to verify API token is configured.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "hasToken": true,
  "message": "API is configured and ready"
}
```

### POST `/api/transcript`
Fetch and parse a podcast transcript.

**Request:**
```json
{
  "url": "https://podcasts.apple.com/us/podcast/episode/id123?i=1000123456"
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "episodeId": "1000123456",
    "title": "Episode Title",
    "podcast": "Podcast Name",
    "duration": "01:23:45",
    "releaseDate": "2024-01-01T00:00:00Z",
    "description": "..."
  },
  "transcript": {
    "fullText": "Complete transcript...",
    "segments": [
      {
        "begin": "00:00:00",
        "end": "00:00:05",
        "text": "First segment"
      }
    ]
  }
}
```

## Environment Variables

### Required
- `APPLE_BEARER_TOKEN` - Apple API authentication token

### Where to Set
- **Local development:** `.env` file
- **Vercel deployment:** Project Settings → Environment Variables

## Documentation Files

### README.md
Main documentation with:
- Quick start guide
- Token acquisition overview
- Vercel deployment steps
- Local development setup
- Troubleshooting
- API documentation

### GETTING_TOKEN.md
Detailed step-by-step instructions for:
- Getting Apple API bearer token (3 methods)
- Verifying token works
- Common issues and solutions
- Token maintenance

### DEPLOYMENT.md
Complete Vercel deployment guide:
- Dashboard deployment
- CLI deployment
- One-click deploy
- Environment variable setup
- Post-deployment verification
- Troubleshooting
- Best practices

## Key Features

### Security
- ✅ API tokens stored server-side only
- ✅ Never exposed to client
- ✅ Encrypted in Vercel environment variables
- ✅ CORS properly configured

### Scalability
- ✅ Serverless functions auto-scale
- ✅ Edge network distribution
- ✅ No server management needed
- ✅ Pay only for what you use

### Developer Experience
- ✅ Simple deployment (one command)
- ✅ Automatic deployments via Git
- ✅ Preview deployments for PRs
- ✅ Local development with `vercel dev`
- ✅ Comprehensive documentation

### User Experience
- ✅ Fast global access via edge network
- ✅ Same clean UI as before
- ✅ More reliable (no CORS proxy issues)
- ✅ Access to all podcasts (not just public RSS)

## Migration Path

### For Users

**Old way (GitHub Pages):**
1. Fork repo
2. Enable GitHub Pages
3. Done

**New way (Vercel):**
1. Click deploy button OR fork and connect to Vercel
2. Get Apple API token (one-time setup)
3. Add token to Vercel environment variables
4. Done

### For Developers

**To deploy locally:**
```bash
git clone <repo>
npm install
cp .env.example .env
# Add your token to .env
npm run dev
```

**To deploy to production:**
```bash
vercel --prod
# Add token via Vercel dashboard or CLI
```

## Token Management

### Expiration
- Tokens expire every 30 days
- Users need to refresh monthly
- Clear error messages when expired

### How to Get
1. **Method 1:** Browser DevTools (recommended)
   - Go to podcasts.apple.com
   - Open Network tab
   - Play a podcast
   - Copy Bearer token from request headers

2. **Method 2:** Browser console
   - Paste provided script
   - Copy token from output

3. **Method 3:** curl (advanced)
   - Use provided curl command
   - Extract token from response

### How to Update
1. Get new token
2. Update in Vercel: Settings → Environment Variables
3. Redeploy (automatic or manual)

## Testing

### Parser Test
- File: `test-parser.js` (gitignored)
- Tests TTML parsing logic
- Verifies segment extraction
- All tests passing ✅

### Manual Testing
1. Health endpoint: `curl /api/health`
2. Local dev: `vercel dev` or `npm run dev`
3. Production: Test on deployed Vercel URL

## Dependencies

### Production
- `axios` - HTTP client for API requests
- `xml2js` - TTML/XML parsing

### Development
- `vercel` - Vercel CLI for local dev and deployment

## What's Next

Users should:
1. Read README.md for overview
2. Follow GETTING_TOKEN.md to get their token
3. Use DEPLOYMENT.md to deploy to Vercel
4. Set up monthly reminder to refresh token

## Breaking Changes

⚠️ **This is a complete rewrite**

- Different deployment platform (Vercel vs GitHub Pages)
- Requires API token (vs no auth)
- Different URL structure
- Server-side processing (vs client-side)

The old GitHub Pages version in `/docs` still exists but is not maintained.

## Advantages Over Old Version

1. **More Reliable**
   - No CORS proxy dependencies
   - Direct API access
   - Better error handling

2. **More Capable**
   - Access all podcasts (not just RSS-available ones)
   - More recent episodes
   - Better metadata

3. **More Secure**
   - Tokens on server-side
   - No token exposure
   - Encrypted environment variables

4. **Better Performance**
   - Edge network distribution
   - Serverless auto-scaling
   - No proxy overhead

5. **Better DX**
   - Easy deployment
   - Automatic Git integration
   - Preview deployments
   - Great documentation

## Maintenance

### Monthly
- Refresh Apple API token
- Update in Vercel

### As Needed
- Update dependencies (`npm update`)
- Monitor Vercel usage
- Check for API changes

### Optional
- Custom domain setup
- Analytics monitoring
- Error tracking

## Cost

### Free Tier (Vercel)
- 100 GB bandwidth/month
- 100 GB-hours function execution
- More than enough for personal use
- ✅ **This app fits well within free tier**

### If You Need More
- Pro plan: $20/month
- 1 TB bandwidth
- 1000 GB-hours execution
- Priority support

## Support

- **Documentation:** See README.md, GETTING_TOKEN.md, DEPLOYMENT.md
- **Issues:** GitHub Issues
- **Vercel Docs:** vercel.com/docs
- **Apple API:** (unofficial, reverse-engineered)

## Summary

This rebuild transforms a client-side GitHub Pages app into a modern, serverless, server-authenticated application on Vercel. It provides better reliability, security, and capabilities while maintaining ease of use. The comprehensive documentation ensures users can easily set up and maintain their deployment.
