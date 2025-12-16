// backend/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Static bearer token and signature from Apple API
// These need to be refreshed every 30 days
const BEARER_TOKEN = process.env.APPLE_BEARER_TOKEN;
const ACTION_SIGNATURE = process.env.APPLE_ACTION_SIGNATURE;
const REQUEST_TIMESTAMP = process.env.APPLE_REQUEST_TIMESTAMP;

// Get or fetch bearer token from Apple
async function getOrFetchBearerToken() {
  if (BEARER_TOKEN) return BEARER_TOKEN;
  
  try {
    const url = 'https://sf-api-token-service.itunes.apple.com/apiToken?clientClass=apple&clientId=com.apple.podcasts.macos&os=OS%20X&osVersion=15.5&productVersion=1.1.0&version=2';
    
    const response = await axios.get(url, {
      headers: {
        'x-request-timestamp': REQUEST_TIMESTAMP || new Date().toISOString(),
        'X-Apple-ActionSignature': ACTION_SIGNATURE,
        'X-Apple-Store-Front': '143441-1,42 t:podcasts1',
      },
      timeout: 10000,
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Error getting bearer token:', error.message);
    throw new Error('Failed to authenticate with Apple API');
  }
}

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

// Main endpoint to get transcript
app.post('/api/transcript', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Extract podcast ID from URL
    const match = url.match(/\?i=(\d+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid podcast URL' });
    }
    
    const episodeId = match[1];
    
    // Get bearer token
    const token = await getOrFetchBearerToken();
    
    // Fetch transcript metadata
    const metadataUrl = `https://amp-api.podcasts.apple.com/v1/catalog/us/podcast-episodes/${episodeId}/transcripts?fields=ttmlToken,ttmlAssetUrls&include%5Bpodcast-episodes%5D=podcast&l=en-US&with=entitlements`;
    
    const metadataResponse = await axios.get(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Podcasts/1.1.0 (Macintosh; OS X 15.5)',
      },
      timeout: 10000,
    });
    
    const data = metadataResponse.data?.data?.[0];
    if (!data) {
      return res.status(404).json({ error: 'Transcript not found for this episode' });
    }
    
    const ttmlUrl = data.attributes?.ttmlAssetUrls?.ttml;
    if (!ttmlUrl) {
      return res.status(404).json({ error: 'Transcript URL not available' });
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
    
    res.json({
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
      res.status(401).json({ 
        error: 'Authentication failed. Bearer token may have expired.',
        hint: 'Update APPLE_BEARER_TOKEN in environment variables'
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Episode not found or transcript not available' });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasToken: !!BEARER_TOKEN,
    hasSignature: !!ACTION_SIGNATURE,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
