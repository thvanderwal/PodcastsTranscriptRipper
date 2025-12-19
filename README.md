# Apple Podcast Transcript Exporter - Vercel Edition

A serverless application that extracts full transcripts from Apple Podcasts using Apple's authenticated API. Deployed on Vercel with automatic scaling and edge network distribution.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thvanderwal/PodcastsTranscriptRipper)

1. Click the deploy button above
2. Follow the Vercel setup wizard
3. Configure your Apple API token (see below)
4. Your app will be live in minutes!

## 📋 Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works great!)
- An Apple API Bearer Token (instructions below)

## 🔑 Getting Your Apple API Bearer Token

The Apple Podcast API requires authentication via a bearer token. Here's how to get it:

### Method 1: Using Apple Podcasts Web Player (Recommended)

1. **Open Apple Podcasts in your browser:**
   - Go to [podcasts.apple.com](https://podcasts.apple.com)
   - Sign in with your Apple ID

2. **Open Browser Developer Tools:**
   - Press `F12` or right-click and select "Inspect"
   - Go to the **Network** tab

3. **Play any podcast episode:**
   - Find any podcast episode and start playing it
   - In the Network tab, filter by "XHR" or search for "amp-api"

4. **Find the API request:**
   - Look for requests to `amp-api.podcasts.apple.com`
   - Click on any of these requests

5. **Extract the Bearer Token:**
   - In the request details, go to **Headers**
   - Find the `Authorization` header
   - Copy the token after `Bearer ` (everything after "Bearer ")
   - It will look like: `eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...`

### Method 2: Using Browser Console (Alternative)

1. Go to [podcasts.apple.com](https://podcasts.apple.com) and sign in
2. Open the browser console (F12 → Console tab)
3. Paste this code and press Enter:

```javascript
fetch('https://sf-api-token-service.itunes.apple.com/apiToken')
  .then(r => r.json())
  .then(data => console.log('Your token:', data.token));
```

4. Copy the token from the console output

### Important Notes About Tokens

- ⏰ **Tokens expire after 30 days** - you'll need to update them monthly
- 🔒 **Tokens are tied to your Apple ID** - don't share them publicly
- 🔄 **Vercel environment variables are encrypted** - safe to store there
- 📧 **Set a calendar reminder** to refresh your token every month

## ⚙️ Setting Up the Token in Vercel

### Option A: Through Vercel Dashboard (Easiest)

1. Go to your project on [Vercel](https://vercel.com)
2. Click on **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `APPLE_BEARER_TOKEN`
   - **Value:** (paste your token)
   - **Environments:** Check all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application (Settings → Deployments → click "..." → Redeploy)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Add the environment variable
vercel env add APPLE_BEARER_TOKEN

# Paste your token when prompted
# Select: Production, Preview, and Development

# Redeploy
vercel --prod
```

## 🛠️ Local Development

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/thvanderwal/PodcastsTranscriptRipper.git
   cd PodcastsTranscriptRipper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Add your Apple API token to `.env`:**
   ```
   APPLE_BEARER_TOKEN=your_actual_token_here
   ```

### Running Locally

```bash
# Start the Vercel development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Testing the API

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

Test fetching a transcript:
```bash
curl -X POST http://localhost:3000/api/transcript \
  -H "Content-Type: application/json" \
  -d '{"url":"https://podcasts.apple.com/us/podcast/example/id123456?i=1000123456789"}'
```

## 📁 Project Structure

```
PodcastsTranscriptRipper/
├── api/                      # Vercel serverless functions
│   ├── transcript.js         # Main transcript API endpoint
│   └── health.js             # Health check endpoint
├── public/                   # Static frontend files
│   ├── index.html           # Main HTML page
│   ├── app.js               # Frontend JavaScript
│   └── styles.css           # Styling
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## 🎯 How to Use

1. **Visit your deployed app** (e.g., `your-app.vercel.app`)
2. **Find a podcast episode on Apple Podcasts:**
   - Go to [podcasts.apple.com](https://podcasts.apple.com)
   - Find an episode you want to transcribe
   - Copy the URL (must include `?i=` parameter)
3. **Paste the URL** into the app
4. **Click "Extract Transcript"**
5. **Download in your preferred format** (TXT, SRT, or JSON)

### Example URLs

✅ Valid:
- `https://podcasts.apple.com/us/podcast/episode-name/id123456?i=1000123456789`

❌ Invalid:
- `https://podcasts.apple.com/us/podcast/podcast-name/id123456` (missing `?i=` parameter)

## 🚨 Troubleshooting

### "Authentication failed" error

**Problem:** Your bearer token has expired (tokens last 30 days)

**Solution:** 
1. Get a new token using the instructions above
2. Update it in Vercel (Settings → Environment Variables)
3. Redeploy your app

### "Transcript not found" error

**Possible causes:**
1. The episode doesn't have a transcript (not all episodes do)
2. The episode ID is incorrect
3. The episode is region-restricted

**Solution:** Try a different episode that you know has transcripts

### API not configured

**Problem:** The environment variable isn't set

**Solution:** Make sure you've added `APPLE_BEARER_TOKEN` to your Vercel environment variables

### CORS errors

**Problem:** Cross-origin request blocked

**Solution:** This shouldn't happen with the Vercel deployment. If it does:
1. Check that you're accessing the app through its proper Vercel URL
2. Don't use local file:// URLs - use `npm run dev` instead

## 🔄 Updating Your Token (Monthly Maintenance)

1. **Get a new token** using one of the methods above
2. **Update in Vercel:**
   - Dashboard: Settings → Environment Variables → Edit `APPLE_BEARER_TOKEN`
   - Or use CLI: `vercel env rm APPLE_BEARER_TOKEN` then `vercel env add APPLE_BEARER_TOKEN`
3. **Redeploy** (Vercel usually auto-redeploys, but you can trigger manually if needed)

## 🎨 Features

- ✅ Extract full transcripts from Apple Podcasts
- ✅ View episode metadata (title, podcast name, duration, release date)
- ✅ Export transcripts in multiple formats (TXT, SRT, JSON)
- ✅ Copy transcript to clipboard
- ✅ Responsive design for mobile and desktop
- ✅ Server-side authentication (no token exposure to clients)
- ✅ Serverless architecture (auto-scaling, no server management)
- ✅ Edge network distribution (fast global access)

## 🛡️ Security Notes

- The Apple API token is stored securely in Vercel environment variables
- Tokens are never exposed to the client browser
- All API calls are made server-side
- CORS is properly configured for your domain

## 📝 API Documentation

### POST `/api/transcript`

Fetches and parses a podcast transcript.

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
    "description": "Episode description"
  },
  "transcript": {
    "fullText": "Complete transcript text...",
    "segments": [
      {
        "begin": "00:00:00",
        "end": "00:00:05",
        "text": "First segment text"
      }
    ]
  }
}
```

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "hasToken": true,
  "message": "API is configured and ready"
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- Apple Podcasts for providing the transcript API
- Vercel for serverless hosting platform
- All podcast creators who provide transcripts for accessibility

## ⚠️ Disclaimer

This tool is for personal use only. Respect copyright and terms of service of podcast creators. Transcripts are property of their respective creators.