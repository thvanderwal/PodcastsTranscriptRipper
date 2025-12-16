// app.js
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://your-backend-url.com'; // Update with your deployed backend URL

let currentTranscript = null;

document.getElementById('fetch-btn').addEventListener('click', fetchTranscript);
document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

async function fetchTranscript() {
  const url = document.getElementById('podcast-url').value.trim();
  
  if (!url) {
    showError('Please enter a podcast URL');
    return;
  }

  hideError();
  showLoading();
  hideResults();

  try {
    const response = await fetch(`${API_URL}/api/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transcript');
    }

    currentTranscript = data;
    displayResults(data);

  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

function displayResults(data) {
  const { metadata, transcript } = data;

  // Display metadata
  const metadataHTML = `
    <div class="metadata-item">
      <span class="metadata-label">Title:</span>
      <span class="metadata-value">${metadata.title}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Podcast:</span>
      <span class="metadata-value">${metadata.podcast}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Duration:</span>
      <span class="metadata-value">${metadata.duration}</span>
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

  showResults();
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
  });
}

function downloadTranscript(format) {
  if (!currentTranscript) return;

  const { metadata, transcript } = currentTranscript;
  let content = '';
  let filename = `transcript_${metadata.episodeId}`;
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

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'flex';
}

function hideError() {
  document.getElementById('error').style.display = 'none';
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
