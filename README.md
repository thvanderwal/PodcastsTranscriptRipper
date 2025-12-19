# Apple Podcast Transcript Exporter - GitHub Pages Ready

A **fully client-side** application that works immediately on GitHub Pages without any backend setup or configuration.

## Quick Start

1. Fork this repository
2. Enable GitHub Pages (Settings → Pages → Source: main branch → /docs folder)
3. Visit your site at `https://yourusername.github.io/PodcastsTranscriptRipper/`

That's it! No configuration needed.

## How It Works

This tool uses Apple's **public, unauthenticated** podcast RSS feeds to extract transcripts. No API keys or backend required!

## Features

- Extract full transcripts from Apple Podcasts episodes
- View episode metadata (title, podcast name, duration, release date)
- Export transcripts in multiple formats (TXT, SRT, JSON)
- Copy transcript to clipboard
- Responsive design for mobile and desktop
- Works entirely in your browser - no data sent to any server

## Project Structure

```
podcast-transcript-exporter/
├── docs/                    # GitHub Pages serves from here
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── .github/
│   └── workflows/
│       └── deploy.yml       # Automatic deployment to GitHub Pages
└── README.md
```

## Important Notes

1. **Transcripts are extracted from Apple's RSS feeds.** Not all podcasts have transcripts available. If a transcript isn't found, the podcast creator may not have provided one.

2. **CORS Proxies**: The app uses public CORS proxies to fetch RSS feeds. If a proxy is down, the app will try alternative proxies.

3. **Privacy**: Works entirely in your browser. No data is sent to any server (except the CORS proxies needed to fetch public RSS feeds).

## Troubleshooting

If you encounter errors or the app doesn't find your episode:

1. **Check the browser console** (F12 or right-click → Inspect → Console). The app now includes detailed logging that shows:
   - Episode ID extraction
   - API lookup attempts
   - RSS feed parsing progress
   - Which matching methods were tried
   - Why an episode wasn't found

2. **RSS Feed Limitations**: Public RSS feeds may only include recent episodes (typically the last 100-300 episodes). Older episodes may not be accessible without authentication.

3. **Authentication**: This tool uses **public, unauthenticated RSS feeds**. Some podcast episodes or transcripts may only be available through Apple's authenticated API, which requires special bearer tokens that expire every 30 days. The `backend/server.js` file includes code for authenticated access, but requires Apple API credentials.

4. **Episode Not Found**: If you get an "Episode not found" error, the detailed console logs will show you which RSS feed fields were checked and help determine if the episode simply isn't in the public RSS feed.

## License

MIT