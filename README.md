# Apple Podcast Transcript Exporter

A full-stack application to extract transcripts from Apple Podcasts with metadata.

## Project Structure

```
podcast-transcript-exporter/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## Features

- Extract full transcripts from Apple Podcasts episodes
- View episode metadata (title, podcast name, duration, release date)
- Export transcripts in multiple formats (TXT, SRT, JSON)
- Copy transcript to clipboard
- Responsive design for mobile and desktop

## Setup Instructions

### 1. Clone and Install

```bash
# Clone your repository
git clone https://github.com/yourusername/podcast-transcript-exporter.git
cd podcast-transcript-exporter

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (if using build tools)
cd ../frontend
npm install
```

### 2. Get Apple API Credentials

The hardest part is getting the Apple credentials. You have two options:

**Option A: Use the Python script from the research**
```python
# See the "Alternative script" section in the blog post
# This gives you a one-time signature that works indefinitely
```

**Option B: Use a macOS machine with debugging**
Follow the instructions in the blog post to extract credentials using `lldb`.

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your credentials
```

Environment variables required:
- `PORT` - Server port (default: 3000)
- `APPLE_BEARER_TOKEN` - Bearer token for Apple API authentication
- `APPLE_ACTION_SIGNATURE` - Action signature for API requests
- `APPLE_REQUEST_TIMESTAMP` - Timestamp for signed requests

### 4. Deploy Backend

Deploy the backend to a service like:
- **Render** (free tier available)
- **Railway** (free tier available)
- **Heroku**
- **AWS Lambda** with API Gateway
- **Vercel** (serverless functions)

### 5. Deploy Frontend to GitHub Pages

```bash
# Update app.js with your backend URL
# In app.js, change:
const API_URL = 'https://your-backend-url.com';

# Commit and push
git add .
git commit -m "Initial commit"
git push origin main
```

Enable GitHub Pages in your repository settings (Settings → Pages → Source: GitHub Actions).

## API Endpoints

### POST /api/transcript

Extract transcript from an Apple Podcasts episode.

**Request Body:**
```json
{
  "url": "https://podcasts.apple.com/us/podcast/.../id...?i=1000..."
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "episodeId": "1000...",
    "title": "Episode Title",
    "podcast": "Podcast Name",
    "duration": "01:23:45",
    "releaseDate": "2024-01-15T00:00:00Z",
    "description": "Episode description..."
  },
  "transcript": {
    "fullText": "Full transcript text...",
    "segments": [
      {
        "begin": "00:00:01.000",
        "end": "00:00:05.000",
        "text": "Segment text..."
      }
    ]
  }
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "hasToken": true,
  "hasSignature": true
}
```

## Important Notes

1. **Token Expiration**: Bearer tokens expire every 30 days. You'll need to refresh them.

2. **CORS**: The backend handles CORS, but make sure to configure allowed origins in production.

3. **Rate Limiting**: Consider adding rate limiting to prevent abuse.

4. **Caching**: Consider caching transcripts to reduce API calls.

5. **Error Handling**: The current implementation has basic error handling. Enhance as needed.

## License

MIT