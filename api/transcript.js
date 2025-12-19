// Vercel Serverless Function for fetching podcast transcripts
// This function runs on Vercel's edge network and requires Apple API credentials

const axios = require('axios');
const xml2js = require('xml2js');

// Parse TTML to extract transcript
function parseTTML(ttmlText) {
  const parser = new xml2js.Parser();
  let result = null;
  
  parser.parseString(ttmlText, (err, parsedResult) => {
    if (err) throw err;
    result = parsedResult;
  });
  
  const body = result?.tt?.body?.[0];
  const divs = body?.div || [];
  
  const segments = [];
  let fullText = '';
  
  divs.forEach(div => {
    const paragraphs = div.p || [];
    paragraphs.forEach(p => {
      const text = p._ || p;
      const begin = p.$?.begin || '00:00:00';
      const end = p.$?.end || '00:00:00';
      
      if (typeof text === 'string' && text.trim()) {
        fullText += text.trim() + ' ';
        segments.push({
          begin,
          end,
          text: text.trim()
        });
      }
    });
  });
  
  return { fullText: fullText.trim(), segments };
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  const requestOrigin = req.headers.origin;

  if (requestOrigin && allowedOrigins.length > 0 && allowedOrigins.includes(requestOrigin)) {
    // Restrict CORS to explicitly allowed origins in configuration
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In non-production environments, allow all origins for easier development
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL format and restrict to expected Apple Podcasts domains
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol. Only http and https are allowed.' });
    }

    // Require an Apple domain (e.g., podcasts.apple.com) to match expected Apple Podcasts URLs
    if (!/\.apple\.com$/i.test(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Invalid podcast URL. Please provide a valid Apple Podcasts episode URL.' });
    }
    
    // Extract episode ID from URL query parameters
    const episodeId = parsedUrl.searchParams.get('i');
    if (!episodeId || !/^\d+$/.test(episodeId)) {
      return res.status(400).json({ error: 'Invalid podcast URL. Please provide a valid Apple Podcasts episode URL with ?i= parameter.' });
    }
    
    // Get bearer token from environment
    const BEARER_TOKEN = process.env.APPLE_BEARER_TOKEN;
    
    if (!BEARER_TOKEN) {
      return res.status(500).json({ 
        error: 'Server configuration error: Apple API token not configured.',
        hint: 'The administrator needs to set the APPLE_BEARER_TOKEN environment variable in Vercel.'
      });
    }
    
    // Fetch transcript metadata from Apple API
    const metadataUrl = `https://amp-api.podcasts.apple.com/v1/catalog/us/podcast-episodes/${episodeId}/transcripts?fields=ttmlToken,ttmlAssetUrls&include%5Bpodcast-episodes%5D=podcast&l=en-US&with=entitlements`;
    
    const metadataResponse = await axios.get(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'User-Agent': 'Podcasts/1.1.0 (Macintosh; OS X 15.5)',
      },
      timeout: 10000,
    });
    
    const data = metadataResponse.data?.data?.[0];
    if (!data) {
      return res.status(404).json({ 
        error: 'Transcript not found for this episode',
        hint: 'This episode may not have a transcript available, or the episode ID may be incorrect.'
      });
    }
    
    const ttmlUrl = data.attributes?.ttmlAssetUrls?.ttml;
    if (!ttmlUrl) {
      return res.status(404).json({ 
        error: 'Transcript URL not available',
        hint: 'The episode exists but does not have a transcript file available.'
      });
    }
    
    // Fetch the TTML file
    const ttmlResponse = await axios.get(ttmlUrl, {
      timeout: 30000,
    });
    
    // Parse TTML
    const { fullText, segments } = parseTTML(ttmlResponse.data);
    
    // Get episode metadata
    const episodeData = metadataResponse.data?.included?.find(
      item => item.type === 'podcast-episodes'
    );
    
    const metadata = {
      episodeId,
      title: episodeData?.attributes?.name || 'Unknown',
      podcast: episodeData?.relationships?.podcast?.data?.id || 'Unknown',
      duration: episodeData?.attributes?.durationInMilliseconds 
        ? new Date(episodeData.attributes.durationInMilliseconds).toISOString().substring(11, 19)
        : 'Unknown',
      releaseDate: episodeData?.attributes?.releaseDateTime || null,
      description: episodeData?.attributes?.description?.standard || '',
    };
    
    res.status(200).json({
      success: true,
      metadata,
      transcript: {
        fullText,
        segments,
      },
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Authentication failed with Apple API',
        hint: 'The bearer token may have expired (tokens expire every 30 days). Please update APPLE_BEARER_TOKEN in Vercel environment variables.'
      });
    } else if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Episode not found or transcript not available',
        hint: 'The episode may not exist or may not have a transcript.'
      });
    } else {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.'
      });
    }
  }
};
