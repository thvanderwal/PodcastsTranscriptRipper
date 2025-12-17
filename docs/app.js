let currentTranscript = null;

// Enable debug logging to help diagnose API and episode lookup issues
// Set to true if you're experiencing issues and want to see detailed console logs
const DEBUG = false;

document.getElementById('fetch-btn').addEventListener('click', fetchTranscript);
document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

// CORS proxy options (try multiple in case one is down)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

let currentProxyIndex = 0;

async function fetchWithCORS(url) {
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length;
    const proxy = CORS_PROXIES[proxyIndex];
    
    try {
      if (DEBUG) console.log(`Fetching via proxy ${proxyIndex + 1}/${CORS_PROXIES.length}: ${url.substring(0, 80)}...`);
      const response = await fetch(proxy + encodeURIComponent(url), {
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        currentProxyIndex = proxyIndex; // Use this proxy next time
        if (DEBUG) console.log(`✓ Successfully fetched via proxy ${proxyIndex + 1}`);
        return response;
      } else {
        if (DEBUG) console.warn(`Proxy ${proxyIndex + 1} returned status ${response.status}`);
      }
    } catch (error) {
      if (DEBUG) console.warn(`Proxy ${proxyIndex + 1} failed:`, error.message);
      if (i === CORS_PROXIES.length - 1) throw error;
      continue; // Try next proxy
    }
  }
  throw new Error('All CORS proxies failed. Please check your internet connection and try again later.');
}

function extractPodcastId(url) {
  const match = url.match(/id(\d+)/);
  return match ? match[1] : null;
}

function extractEpisodeId(url) {
  const match = url.match(/\?i=(\d+)/);
  return match ? match[1] : null;
}

function parseTTML(ttmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(ttmlText, 'text/xml');
  
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid TTML format');
  }
  
  const pElements = xmlDoc.getElementsByTagName('p');
  
  let fullText = '';
  const segments = [];
  
  for (let p of pElements) {
    const begin = p.getAttribute('begin') || '00:00:00';
    const end = p.getAttribute('end') || '00:00:00';
    const text = p.textContent.trim();
    
    if (text) {
      fullText += text + ' ';
      segments.push({ begin, end, text });
    }
  }
  
  return { 
    fullText: fullText.trim(), 
    segments,
    hasTranscript: segments.length > 0
  };
}

async function fetchTranscript() {
  const url = document.getElementById('podcast-url').value.trim();
  
  if (!url) {
    showError('Please enter a podcast URL');
    return;
  }

  // Validate that this is an Apple Podcasts URL using proper URL parsing
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    showError('Please enter a valid URL');
    return;
  }
  
  if (parsedUrl.hostname !== 'podcasts.apple.com') {
    showError('Please enter a valid Apple Podcasts URL');
    return;
  }

  hideError();
  hideWarning();
  showLoading();
  hideResults();

  try {
    const podcastId = extractPodcastId(url);
    const episodeId = extractEpisodeId(url);
    
    if (DEBUG) console.log('Extracted IDs - Podcast:', podcastId, 'Episode:', episodeId);
    
    if (!podcastId && !episodeId) {
      throw new Error('Could not extract podcast or episode ID from URL. Make sure you copied the complete URL.');
    }

    let podcastInfo = null;
    let feedUrl = null;
    
    // If we have an episode ID, try looking it up directly first
    // This can give us more accurate episode matching
    if (episodeId) {
      try {
        if (DEBUG) console.log('Attempting episode direct lookup...');
        const episodeLookupUrl = `https://itunes.apple.com/lookup?id=${episodeId}`;
        const episodeLookupResponse = await fetchWithCORS(episodeLookupUrl);
        const episodeLookupData = await episodeLookupResponse.json();
        
        if (DEBUG) console.log('Episode lookup response:', episodeLookupData.resultCount, 'results');
        
        if (episodeLookupData.results && episodeLookupData.results.length > 0) {
          // The first result should be the episode, but we need the podcast info for the feed
          // Sometimes the results include both episode and podcast
          const results = episodeLookupData.results;
          
          // Look for podcast info in results (kind === 'podcast')
          podcastInfo = results.find(r => r.kind === 'podcast' || (r.wrapperType === 'track' && r.collectionId));
          
          // If we found podcast info from episode lookup, use it
          if (podcastInfo && podcastInfo.feedUrl) {
            feedUrl = podcastInfo.feedUrl;
            if (DEBUG) console.log('✓ Found feed URL from episode lookup:', feedUrl);
          } else if (results[0] && results[0].collectionId) {
            // Episode found but no podcast in results, lookup podcast by collectionId
            const collectionId = results[0].collectionId;
            if (DEBUG) console.log('Episode found, looking up podcast by collectionId:', collectionId);
            const podcastLookupUrl = `https://itunes.apple.com/lookup?id=${collectionId}&entity=podcast`;
            const podcastLookupResponse = await fetchWithCORS(podcastLookupUrl);
            const podcastLookupData = await podcastLookupResponse.json();
            
            if (podcastLookupData.results && podcastLookupData.results.length > 0) {
              podcastInfo = podcastLookupData.results[0];
              feedUrl = podcastInfo.feedUrl;
              if (DEBUG) console.log('✓ Found feed URL from podcast lookup:', feedUrl);
            }
          }
        }
      } catch (error) {
        if (DEBUG) console.warn('Episode lookup failed, falling back to podcast lookup:', error.message);
        // Continue to podcast lookup fallback below
      }
    }
    
    // Fallback: lookup by podcast ID if we haven't found the feed yet
    if (!feedUrl && podcastId) {
      if (DEBUG) console.log('Using podcast lookup (fallback or no episode ID)...');
      const lookupUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`;
      const lookupResponse = await fetchWithCORS(lookupUrl);
      const lookupData = await lookupResponse.json();
      
      if (DEBUG) console.log('Podcast lookup response:', lookupData.resultCount, 'results');
      
      if (!lookupData.results || lookupData.results.length === 0) {
        throw new Error('Podcast not found. Please check the URL and try again.');
      }

      podcastInfo = lookupData.results[0];
      feedUrl = podcastInfo.feedUrl;
      if (DEBUG) console.log('✓ Found feed URL:', feedUrl);
    }
    
    if (!feedUrl) {
      throw new Error('Could not find RSS feed for this podcast.');
    }

    // Fetch RSS feed
    if (DEBUG) console.log('Fetching RSS feed...');
    const feedResponse = await fetchWithCORS(feedUrl);
    const feedText = await feedResponse.text();
    
    const parser = new DOMParser();
    const feedDoc = parser.parseFromString(feedText, 'text/xml');
    
    const allItems = feedDoc.querySelectorAll('item');
    if (DEBUG) console.log(`RSS feed contains ${allItems.length} episodes`);
    
    let targetItem = null;
    let episodeAudioUrl = null;
    
    if (episodeId) {
      // First, try to get the episode's audio URL from Apple's API
      try {
        if (DEBUG) console.log(`Looking up episode ${episodeId} to get audio URL...`);
        const episodeLookupUrl = `https://itunes.apple.com/lookup?id=${episodeId}&entity=podcastEpisode`;
        const episodeLookupResponse = await fetchWithCORS(episodeLookupUrl);
        const episodeLookupData = await episodeLookupResponse.json();
        
        if (episodeLookupData.results && episodeLookupData.results.length > 0) {
          const episodeInfo = episodeLookupData.results.find(r => r.trackId?.toString() === episodeId.toString());
          if (episodeInfo) {
            // Get the audio URL - this is the key to matching with RSS feed
            // episodeUrl is the full episode, previewUrl is a 90-second preview (fallback)
            episodeAudioUrl = episodeInfo.episodeUrl || episodeInfo.previewUrl;
            if (DEBUG) console.log('✓ Found episode audio URL from API:', episodeAudioUrl ? episodeAudioUrl.substring(0, 80) + '...' : 'none');
          }
        }
      } catch (error) {
        if (DEBUG) console.warn('Failed to lookup episode audio URL from API:', error.message);
        // Continue with fallback methods
      }
      
      if (DEBUG) console.log(`Searching for episode in RSS feed...`);
      
      // Try to match by audio URL first (most reliable method)
      if (episodeAudioUrl) {
        if (DEBUG) console.log('Attempting to match by audio URL...');
        for (let item of allItems) {
          const enclosure = item.querySelector('enclosure');
          const enclosureUrl = enclosure?.getAttribute('url') || '';
          
          // Match the audio URL - compare base URLs without query params for reliability
          if (enclosureUrl.length > 0) {
            const cleanEnclosureUrl = enclosureUrl.split('?')[0];
            const cleanEpisodeUrl = episodeAudioUrl.split('?')[0];
            
            if (cleanEnclosureUrl === cleanEpisodeUrl) {
              targetItem = item;
              if (DEBUG) console.log('✓ Found episode by audio URL match');
              break;
            }
          }
        }
      }
      
      // Fallback: Try other matching methods if audio URL matching didn't work
      if (!targetItem) {
        if (DEBUG) console.log('Audio URL match failed, trying other methods...');
        for (let item of allItems) {
          // Check GUID
          const guid = item.querySelector('guid')?.textContent || '';
          if (guid.includes(episodeId)) {
            targetItem = item;
            if (DEBUG) console.log('✓ Found episode by GUID match');
            break;
          }
          
          // Check enclosure URL (often contains episode ID)
          const enclosure = item.querySelector('enclosure');
          const enclosureUrl = enclosure?.getAttribute('url') || '';
          if (enclosureUrl.includes(episodeId)) {
            targetItem = item;
            if (DEBUG) console.log('✓ Found episode by enclosure URL match');
            break;
          }
          
          // Check iTunes episode ID tag
          const itunesEpisode = item.querySelector('itunes\\:episode, episode');
          const itunesEpisodeText = itunesEpisode?.textContent || '';
          if (itunesEpisodeText.includes(episodeId)) {
            targetItem = item;
            if (DEBUG) console.log('✓ Found episode by iTunes episode tag match');
            break;
          }
          
          // Check link field
          const link = item.querySelector('link')?.textContent || '';
          if (link.includes(episodeId)) {
            targetItem = item;
            if (DEBUG) console.log('✓ Found episode by link match');
            break;
          }
        }
      }
      
      if (!targetItem) {
        console.error(`Episode ${episodeId} not found in any of the ${allItems.length} episodes in the RSS feed`);
        if (DEBUG && episodeAudioUrl) console.error('Episode audio URL from API:', episodeAudioUrl);
        // Episode ID not found in feed
        throw new Error(`Episode ${episodeId} not found in the podcast's RSS feed. This could happen if:\n\n` +
          `1. The episode was recently published and hasn't appeared in the RSS feed yet\n` +
          `2. The episode was removed or made private\n` +
          `3. The RSS feed doesn't include this episode ID in any of its fields\n\n` +
          `Please try again later or verify the episode URL is correct.`);
      }
    } else {
      // Get latest episode
      targetItem = feedDoc.querySelector('item');
      if (DEBUG) console.log('Using latest episode from feed');
    }
    
    if (!targetItem) {
      throw new Error('Could not find episode in podcast feed.');
    }
    
    // Extract episode metadata
    const title = targetItem.querySelector('title')?.textContent || 'Unknown Episode';
    const description = targetItem.querySelector('description')?.textContent || '';
    const pubDate = targetItem.querySelector('pubDate')?.textContent || '';
    const duration = targetItem.querySelector('duration')?.textContent || 'Unknown';
    
    // Look for transcript in various podcast namespace formats
    const transcriptElement = 
      targetItem.querySelector('podcast\\:transcript, transcript') ||
      targetItem.querySelector('[type*="application/srt"]') ||
      targetItem.querySelector('[type*="application/x-subrip"]') ||
      targetItem.querySelector('[rel="captions"]');
    
    let transcriptUrl = transcriptElement?.getAttribute('url') || 
                        transcriptElement?.getAttribute('href') ||
                        transcriptElement?.textContent?.trim();
    
    if (!transcriptUrl) {
      showWarning(`Episode found: "${title}"\n\nUnfortunately, this episode doesn't have a transcript available in the RSS feed. The podcast creator may not have provided one, or it may only be available through Apple's API (which requires authentication).\n\nSome podcasts include transcripts in their show notes instead.`);
      
      // Still show metadata even without transcript
      currentTranscript = {
        metadata: {
          episodeId: episodeId || 'N/A',
          title,
          podcast: podcastInfo.collectionName || podcastInfo.trackName,
          duration,
          releaseDate: pubDate,
          description,
        },
        transcript: {
          fullText: 'No transcript available for this episode.',
          segments: [],
        }
      };
      
      displayResults(currentTranscript, false);
      return;
    }

    // Fetch and parse transcript
    const transcriptResponse = await fetchWithCORS(transcriptUrl);
    const transcriptText = await transcriptResponse.text();
    
    let parsedTranscript;
    
    // Try to parse as TTML first, then SRT
    if (transcriptText.includes('<tt') || transcriptText.includes('<?xml')) {
      parsedTranscript = parseTTML(transcriptText);
    } else {
      // Assume SRT format
      parsedTranscript = parseSRT(transcriptText);
    }
    
    if (!parsedTranscript.hasTranscript) {
      throw new Error('Transcript file is empty or could not be parsed.');
    }

    currentTranscript = {
      metadata: {
        episodeId: episodeId || 'N/A',
        title,
        podcast: podcastInfo.collectionName || podcastInfo.trackName,
        duration,
        releaseDate: pubDate,
        description,
      },
      transcript: parsedTranscript,
    };

    displayResults(currentTranscript, true);

  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to fetch transcript: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function parseSRT(srtText) {
  const segments = [];
  let fullText = '';
  
  const blocks = srtText.split(/\n\s*\n/);
  
  for (let block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const timeCode = lines[1];
      const text = lines.slice(2).join(' ').trim();
      
      const [begin, end] = timeCode.split('-->').map(t => t.trim());
      
      if (text) {
        fullText += text + ' ';
        segments.push({ begin, end, text });
      }
    }
  }
  
  return {
    fullText: fullText.trim(),
    segments,
    hasTranscript: segments.length > 0
  };
}

function displayResults(data, hasTranscript) {
  const { metadata, transcript } = data;

  // Display metadata
  const metadataHTML = `
    <div class="metadata-item">
      <span class="metadata-label">Title:</span>
      <span class="metadata-value">${escapeHtml(metadata.title)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Podcast:</span>
      <span class="metadata-value">${escapeHtml(metadata.podcast)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Duration:</span>
      <span class="metadata-value">${formatDuration(metadata.duration)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Episode ID:</span>
      <span class="metadata-value">${metadata.episodeId}</span>
    </div>
    ${metadata.releaseDate ? `
      <div class="metadata-item">
        <span class="metadata-label">Released:</span>
        <span class="metadata-value">${new Date(metadata.releaseDate).toLocaleDateString()}</span>
      </div>
    ` : ''}
  `;
  document.getElementById('metadata').innerHTML = metadataHTML;

  // Display transcript
  document.getElementById('transcript-text').textContent = transcript.fullText;

  // Hide copy/export buttons if no transcript
  if (!hasTranscript) {
    document.getElementById('copy-btn').style.display = 'none';
    document.querySelector('.export-section').style.display = 'none';
  } else {
    document.getElementById('copy-btn').style.display = 'flex';
    document.querySelector('.export-section').style.display = 'block';
  }

  showResults();
}

function formatDuration(duration) {
  if (!duration || duration === 'Unknown') return 'Unknown';
  
  // If already formatted (HH:MM:SS), return as is
  if (duration.includes(':')) return duration;
  
  // If it's just seconds, convert
  const seconds = parseInt(duration);
  if (!isNaN(seconds)) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  return duration;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyToClipboard() {
  const text = document.getElementById('transcript-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
    btn.style.backgroundColor = '#10b981';
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.backgroundColor = '';
    }, 2000);
  }).catch(() => {
    showError('Failed to copy to clipboard');
  });
}

function downloadTranscript(format) {
  if (!currentTranscript) return;

  const { metadata, transcript } = currentTranscript;
  let content = '';
  let filename = `transcript_${sanitizeFilename(metadata.title)}`;
  let mimeType = 'text/plain';

  if (format === 'txt') {
    content = `Title: ${metadata.title}\n`;
    content += `Podcast: ${metadata.podcast}\n`;
    content += `Duration: ${metadata.duration}\n`;
    content += `Episode ID: ${metadata.episodeId}\n`;
    if (metadata.releaseDate) {
      content += `Released: ${new Date(metadata.releaseDate).toLocaleDateString()}\n`;
    }
    content += `\n---\n\n${transcript.fullText}`;
    filename += '.txt';
  } else if (format === 'srt') {
    transcript.segments.forEach((seg, i) => {
      content += `${i + 1}\n`;
      content += `${seg.begin} --> ${seg.end}\n`;
      content += `${seg.text}\n\n`;
    });
    filename += '.srt';
    mimeType = 'application/x-subrip';
  } else if (format === 'json') {
    content = JSON.stringify(currentTranscript, null, 2);
    filename += '.json';
    mimeType = 'application/json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'flex';
}

function hideError() {
  document.getElementById('error').style.display = 'none';
}

function showWarning(message) {
  const warningDiv = document.getElementById('warning');
  warningDiv.textContent = message;
  warningDiv.style.display = 'flex';
}

function hideWarning() {
  document.getElementById('warning').style.display = 'none';
}

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showResults() {
  document.getElementById('results').style.display = 'block';
}

function hideResults() {
  document.getElementById('results').style.display = 'none';
}
