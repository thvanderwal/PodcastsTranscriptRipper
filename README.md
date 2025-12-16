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

## License

MIT