let currentTranscript = null;

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
      const response = await fetch(proxy + encodeURIComponent(url), {
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        currentProxyIndex = proxyIndex; // Use this proxy next time
        return response;
      }
    } catch (error) {
      if (i === CORS_PROXIES.length - 1) throw error;
      continue; // Try next proxy
    }
  }
  throw new Error('All CORS proxies failed. Please check your internet connection and try again later.');
}

function extractPodcastId(url) {
  const match = url.match(/id(\d+)/);
  if (match) return match[1];
  
  const episodeMatch = url.match(/\?i=(\d+)/);
  if (episodeMatch) return episodeMatch[1];
  
  return null;
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
    if (!podcastId) {
      throw new Error('Could not extract podcast ID from URL. Make sure you copied the complete URL.');
    }

    // Fetch podcast lookup data
    const lookupUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`;
    const lookupResponse = await fetchWithCORS(lookupUrl);
    const lookupData = await lookupResponse.json();
    
    if (!lookupData.results || lookupData.results.length === 0) {
      throw new Error('Podcast not found. Please check the URL and try again.');
    }

    const podcastInfo = lookupData.results[0];
    const feedUrl = podcastInfo.feedUrl;
    
    if (!feedUrl) {
      throw new Error('Could not find RSS feed for this podcast.');
    }

    // Fetch RSS feed
    const feedResponse = await fetchWithCORS(feedUrl);
    const feedText = await feedResponse.text();
    
    const parser = new DOMParser();
    const feedDoc = parser.parseFromString(feedText, 'text/xml');
    
    // Get episode ID if provided in URL
    const episodeIdMatch = url.match(/\?i=(\d+)/);
    const episodeId = episodeIdMatch ? episodeIdMatch[1] : null;
    
    let targetItem = null;
    
    if (episodeId) {
      // Find specific episode
      const items = feedDoc.querySelectorAll('item');
      for (let item of items) {
        const guid = item.querySelector('guid')?.textContent || '';
        if (guid.includes(episodeId)) {
          targetItem = item;
          break;
        }
      }
      
      if (!targetItem) {
        // Fallback: try to find by episode number in URL
        const episodeNum = url.match(/episode[/-](\d+)/i);
        if (episodeNum) {
          const items = feedDoc.querySelectorAll('item');
          targetItem = items[parseInt(episodeNum[1]) - 1] || items[0];
        } else {
          targetItem = feedDoc.querySelector('item'); // Get latest episode
        }
      }
    } else {
      // Get latest episode
      targetItem = feedDoc.querySelector('item');
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
